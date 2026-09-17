import React, { useEffect } from 'react';
import { Icon } from './Icons';

const OPTIONS = ['A', 'B', 'C', 'D'];

// Verdict line + the four option chips coloured by what was marked.
export function AnswerReview({ attempt, answer }) {
  const attempted = attempt !== '' && attempt !== undefined && attempt !== null;
  const wrong = attempted && attempt !== answer;
  const right = attempted && attempt === answer;
  return (
    <div className={`cp-q-foot ${wrong ? 'answerNotSetQuestion' : ''} ${right ? 'answerCorrectlySetQuestion' : ''}`}>
      {wrong && <p className="cp-q-verdict is-wrong">Oho, you marked it wrong.</p>}
      {right && <p className="cp-q-verdict is-right">Great! That's the right answer.</p>}
      {!attempted && <p className="cp-q-verdict is-skipped">Hmm, you did not attempt this question.</p>}
      <div className="cp-q-options">
        {OPTIONS.map((opt) => {
          const cls = attempt === opt && answer !== opt ? 'submittedAnswerWrongButton'
            : attempt === opt && answer === opt ? 'submittedAnswerCorrectButton'
              : 'otherOptionsButton';
          return (
            <span key={opt} className={`cp-option ${cls}`}>
              Option {opt}
              {answer === opt && <Icon.CheckCircle width={15} height={15} />}
            </span>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Question preview opened from the response sheet or the time-distribution
 * chart: marks, section and level, the rendered question, and the answer review.
 */
export default function QuestionModal({ open, question, imageUrl, onClose }) {
  useEffect(() => {
    if (!open) return undefined;
    function onKey(e) { if (e.key === 'Escape') onClose?.(); }
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);

  if (!open || !question) return null;
  const marks = Number(question.marks);
  const marksClass = marks < 0 ? 'modalNegativeMarks' : marks === 0 ? 'modalZeroMarks' : 'modalPositiveMarks';

  return (
    <div className="cp-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className="cp-modal cp-q-modal" role="dialog" aria-modal="true" aria-labelledby="cp-q-title">
        <div className="cp-q-head">
          <span className={`cp-pill cp-q-marks ${marksClass}`}><span>{question.marks} Marks</span></span>
          <span className="cp-pill subjectLabel" id="cp-q-title">
            <span>{question.sectionName} <tag><Icon.DoubleRight width={11} height={11} /> {question.level}</tag></span>
          </span>
        </div>
        <div className="cp-q-body">
          <img src={imageUrl} alt="Question" />
        </div>
        <AnswerReview attempt={question.attempt} answer={question.answer} />
        <button type="button" className="cp-q-close" onClick={onClose}>Hide</button>
      </div>
    </div>
  );
}
