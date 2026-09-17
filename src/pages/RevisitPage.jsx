import React, { useCallback, useEffect, useRef, useState } from 'react';
import Layout from '../components/Layout';
import { Icon } from '../components/Icons';
import { Card, Pill } from '../components/ui';
import { AnswerReview } from '../components/QuestionModal';
import { getRevisitSolution, getWeeklyExamReport, weeklyRevisitQuestionUrl, weeklyRevisitSolutionUrl } from '../lib/candidateApi';
import { getSearchParam, replaceSearchParam } from '../lib/browser';

function readPosition() {
  let section = parseInt(getSearchParam('section'), 10);
  let question = parseInt(getSearchParam('question'), 10);
  if (Number.isNaN(section) || section < 1) { section = 1; replaceSearchParam('section', 1); }
  if (Number.isNaN(question) || question < 1) { question = 1; replaceSearchParam('question', 1); }
  return { section, question };
}

/**
 * Question-by-question review of an attempt.
 *   exam:   each question comes from revisit-solution.php (with its solution).
 *   weekly: the quiz report is fetched once; questions and solutions render
 *           straight from the quiz endpoints with the token in the query.
 */
export default function RevisitPage({ variant = 'exam' }) {
  const attemptId = parseInt(getSearchParam('attemptId'), 10);
  const [details, setDetails] = useState(null);
  const [found, setFound] = useState(true);
  const [position, setPosition] = useState(readPosition);
  const reportRef = useRef(null); // weekly only
  const seekerRef = useRef(null);

  const buildSectionData = (report) => {
    const map = {};
    (report?.sectionWiseResponse || []).forEach((section, idx) => {
      map[idx + 1] = [section.sectionName, (section.questions || []).length];
    });
    return map;
  };

  const openQuestion = useCallback(async (sectionId, questionId) => {
    replaceSearchParam('section', sectionId);
    replaceSearchParam('question', questionId);
    setPosition({ section: sectionId, question: questionId });

    if (variant === 'weekly') {
      const report = reportRef.current;
      if (!report) return;
      const section = (report.sectionWiseResponse || [])[sectionId - 1];
      const question = (section?.questions || []).find((q) => String(q.order) === String(questionId));
      if (!question) { setFound(false); return; }
      setDetails({
        sectionData: buildSectionData(report),
        questionURL: weeklyRevisitQuestionUrl(question.qi),
        solutionURL: weeklyRevisitSolutionUrl(question.qi),
        answer: question.answer,
        attempt: question.attempt,
        topic: '',
        chapter: '',
        level: '',
      });
      setFound(true);
      return;
    }

    try {
      const data = await getRevisitSolution({ id: attemptId, section: sectionId, question: questionId });
      setDetails(data);
      setFound(true);
    } catch {
      setFound(false);
    }
  }, [variant, attemptId]);

  useEffect(() => {
    const { section, question } = readPosition();
    if (variant === 'weekly') {
      getWeeklyExamReport(attemptId)
        .then((report) => { reportRef.current = report; openQuestion(section, question); })
        .catch(() => setFound(false));
    } else {
      openQuestion(section, question);
    }
  }, [variant, attemptId, openQuestion]);

  const sectionData = details?.sectionData || {};
  const sectionCount = Object.keys(sectionData).length;
  const totalInSection = (s) => sectionData[s]?.[1] ?? 0;

  function seekPrevious() {
    const { section, question } = position;
    let nextQuestion = question - 1;
    let nextSection = section;
    if (nextQuestion < 1 && section !== 1) { nextQuestion = totalInSection(section - 1); nextSection -= 1; } else if (nextQuestion < 1) nextQuestion = 1;
    openQuestion(nextSection, nextQuestion);
  }

  function seekNext() {
    const { section, question } = position;
    let nextQuestion = question + 1;
    let nextSection = section;
    if (nextQuestion > totalInSection(section)) {
      nextQuestion = 1;
      nextSection += 1;
      if (nextSection > sectionCount) { nextSection = sectionCount; nextQuestion = totalInSection(section); }
    }
    openQuestion(nextSection, nextQuestion);
  }

  function scrollActiveIntoView() {
    setTimeout(() => {
      seekerRef.current?.querySelector('.questionSectionButtonActive')?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }, 100);
  }

  function moveSection(delta) {
    let next = position.section + delta;
    if (next < 1) next = 1;
    if (next > sectionCount) next = sectionCount;
    openQuestion(next, 1);
    scrollActiveIntoView();
  }

  const title = variant === 'weekly' ? 'Weekly Exam Revisit' : 'Revisit & Solutions';
  const backTo = { path: '/performance', label: 'My Performance' };
  const sectionName = sectionData[position.section]?.[0] || '';
  const hasMeta = details && (details.topic || details.chapter || details.level);

  return (
    <Layout title={title} backTo={backTo}>
      <div className="cp-page">
        {found && details && (
          <Card>
            <div className="cp-seeker">
              <button type="button" className="cp-icon-btn" onClick={() => moveSection(-1)} aria-label="Previous section"><Icon.ChevronLeft width={18} height={18} /></button>
              <div className="sectionSeekerContainer" ref={seekerRef}>
                {Object.entries(sectionData).map(([key, [name, count]]) => (
                  <button
                    type="button"
                    key={key}
                    className={`questionSectionButton ${String(position.section) === String(key) ? 'questionSectionButtonActive' : ''}`}
                    onClick={() => openQuestion(Number(key), 1)}
                  >
                    <span className="sectionTitleExam">{name}</span>
                    <span className="questionSectionInfo">{count}</span>
                  </button>
                ))}
              </div>
              <button type="button" className="cp-icon-btn" onClick={() => moveSection(1)} aria-label="Next section"><Icon.ChevronRight width={18} height={18} /></button>
            </div>
          </Card>
        )}

        {!found && (
          <section className="cp-card cp-state is-page">
            <span className="cp-state-icon is-warn"><Icon.Sad /></span>
            <strong>Something is wrong.</strong>
            <p>We could not load the questions for this attempt. Please go back to My Performance and try again.</p>
            <a className="cp-btn cp-btn-primary" href="/performance">Go to My Performance</a>
          </section>
        )}

        {found && details && (
          <div className="cp-grid cp-grid-revisit">
            <Card className="cp-q-card">
              <div className="cp-q-card-head">
                <h2><b>Question #{position.question}</b> <span>of {sectionName}</span></h2>
                <div className="cp-pager">
                  <button type="button" className="cp-icon-btn" onClick={seekPrevious} aria-label="Previous question"><Icon.ChevronLeft width={18} height={18} /></button>
                  <span className="cp-pager-count">{position.question} of {totalInSection(position.section)}</span>
                  <button type="button" className="cp-icon-btn" onClick={seekNext} aria-label="Next question"><Icon.ChevronRight width={18} height={18} /></button>
                </div>
              </div>

              {hasMeta && (
                <div className="previewSubjectSummary">
                  <span>{details.topic}</span>
                  {details.topic && <i className="cp-dot" />}
                  <span>{details.chapter}</span>
                  {details.chapter && <i className="cp-dot" />}
                  {details.level && <Pill tone="dark" size="sm">{details.level}</Pill>}
                </div>
              )}

              <div className="cp-q-scroll">
                {details.questionURL
                  ? <img src={details.questionURL} alt="Question" />
                  : <p className="cp-empty">Unable to render the question.</p>}
              </div>

              <AnswerReview attempt={details.attempt} answer={details.answer} />
            </Card>

            <Card className="cp-q-card">
              <div className="cp-q-card-head"><h2>Solution</h2></div>
              <div className="cp-q-scroll" style={{ maxHeight: 560 }}>
                {details.solutionURL && <img src={details.solutionURL} alt="Solution" />}
                {!details.solutionURL && details.solutionPath && details.solutionPath !== '' && (
                  <iframe src={details.solutionPath} title="Solution" />
                )}
                {!details.solutionURL && !details.solutionPath && <p className="cp-empty">No Solution available for this Question</p>}
              </div>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}
