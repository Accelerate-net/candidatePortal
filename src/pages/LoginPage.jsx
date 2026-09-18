import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authenticate, login } from '../lib/candidateApi';
import { isAuthenticated, setToken } from '../lib/auth';
import { getSearchParam, setSearchParam } from '../lib/browser';
import { nextPathFromSearch } from '../lib/api';
import { maskMobile } from '../lib/format';
import { useToast } from '../components/Toast';
import WelcomeSlider from '../components/WelcomeSlider';
import CountryCodeSelect from '../components/CountryCodeSelect';

const COUNTRY_CODE_STORAGE_KEY = 'selectedCountryCode';
const OTP_RESEND_DEFAULT_SECONDS = 119;
const OTP_LENGTH = 4;

const COUNTRIES = [
  { code: '+91', flag: '🇮🇳', name: 'India', digits: 10, regex: /^[6-9]\d{9}$/ },
  { code: '+973', flag: '🇧🇭', name: 'Bahrain', digits: 8, regex: /^\d{8}$/ },
  { code: '+965', flag: '🇰🇼', name: 'Kuwait', digits: 8, regex: /^\d{8}$/ },
  { code: '+968', flag: '🇴🇲', name: 'Oman', digits: 8, regex: /^\d{8}$/ },
  { code: '+974', flag: '🇶🇦', name: 'Qatar', digits: 8, regex: /^\d{8}$/ },
  { code: '+966', flag: '🇸🇦', name: 'Saudi Arabia', digits: 9, regex: /^\d{9}$/ },
  { code: '+971', flag: '🇦🇪', name: 'United Arab Emirates', digits: 9, regex: /^\d{9}$/ },
];

const countryByCode = (code) => COUNTRIES.find((c) => c.code === code) || COUNTRIES[0];

function loadStoredCountryCode() {
  const stored = window.localStorage.getItem(COUNTRY_CODE_STORAGE_KEY);
  return COUNTRIES.some((c) => c.code === stored) ? stored : '+91';
}

// Where to go once logged in: back to the page that sent us here (?next=),
// straight into an exam attempt when reached from an "attempt" link,
// otherwise the courses page.
function redirectPath() {
  const next = nextPathFromSearch();
  if (next) return next;
  const params = new URLSearchParams(window.location.search);
  const action = params.get('action');
  const parentMetadata = params.get('parentMetadata'); // course code
  const childMetadata = params.get('childMetadata'); // exam id
  if (action === 'ATTEMPT' && parentMetadata != null && childMetadata != null) {
    return `/test-series?action=ATTEMPT&courseCode=${parentMetadata}&examCode=${childMetadata}`;
  }
  return '/courses';
}

function formatResendCountdown(seconds) {
  const safe = Math.max(0, parseInt(seconds, 10) || 0);
  const m = String(Math.floor(safe / 60)).padStart(2, '0');
  const s = String(safe % 60).padStart(2, '0');
  return `Resend in ${m}:${s} ${safe >= 60 ? 'min' : 'sec'}`;
}

function maskedFromMessage(message, countryCode, mobile) {
  if (typeof message === 'string') {
    const match = message.match(/sent to\s+(.+)$/i);
    if (match && match[1]) return match[1].trim();
  }
  return maskMobile(countryCode, mobile);
}

/**
 * Two-step login: mobile number -> 4-digit OTP. The flow, validation rules,
 * URL parameters (step, key) and stored country code are the same as the
 * previous page's, so bookmarks and the exam-portal hand-off keep working.
 */
export default function LoginPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [countryCode, setCountryCode] = useState(loadStoredCountryCode);
  const [mobile, setMobile] = useState('');
  const [mobileError, setMobileError] = useState('');
  const [step, setStep] = useState('mobile'); // 'mobile' | 'otp'
  const [masked, setMasked] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(null); // null = hidden
  const [resendSending, setResendSending] = useState(false);
  const warnBeforeLeave = useRef(false);
  const otpRefs = useRef([]);
  const mobileRef = useRef(null);

  const country = countryByCode(countryCode);

  // Already logged in: go straight to the requested page, the exam attempt or
  // the dashboard. Decided once, so a re-run of the effect after the redirect
  // (when the query string is gone) cannot send the candidate elsewhere.
  const redirected = useRef(false);
  useEffect(() => {
    if (redirected.current) return;
    if (isAuthenticated()) {
      redirected.current = true;
      navigate(redirectPath(), { replace: true });
    } else {
      mobileRef.current?.focus();
    }
  }, [navigate]);

  useEffect(() => {
    document.title = 'Login to Crispr';
    function onBeforeUnload(e) {
      if (!warnBeforeLeave.current) return;
      e.preventDefault();
      e.returnValue = 'Do you want to go back to login screen?';
    }
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  // Resend countdown.
  useEffect(() => {
    if (resendSeconds === null || resendSeconds <= 0) return undefined;
    const id = setInterval(() => setResendSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [resendSeconds]);

  useEffect(() => {
    if (step === 'otp') otpRefs.current[0]?.focus();
  }, [step]);

  function validateMobile(value) {
    setMobileError(country.regex.test(value) ? '' : 'Invalid Mobile Number');
  }

  function handleCountryChange(next) {
    window.localStorage.setItem(COUNTRY_CODE_STORAGE_KEY, next);
    setCountryCode(next);
    const cfg = countryByCode(next);
    const trimmed = mobile.replace(/\D/g, '').slice(0, cfg.digits);
    setMobile(trimmed);
    setMobileError('');
    if (trimmed.length > 0) setMobileError(cfg.regex.test(trimmed) ? '' : 'Invalid Mobile Number');
    mobileRef.current?.focus();
  }

  function handleMobileInput(e) {
    const value = e.target.value.replace(/\D/g, '').slice(0, country.digits);
    setMobile(value);
    if (value.length === country.digits) validateMobile(value);
    else setMobileError('');
  }

  function showOtpStep(maskedText) {
    setSearchParam('step', 2);
    warnBeforeLeave.current = true;
    setSending(false);
    setStep('otp');
    setMasked(`as ${maskedText}`);
  }

  async function sendOTP(isResend = false) {
    setSearchParam('step', 1);
    if (!country.regex.test(mobile)) {
      if (isResend) { setResendSending(false); setResendSeconds(0); }
      toast('Enter a valid mobile number');
      return;
    }
    setSending(true);
    try {
      const response = await authenticate({ mobile, countryCode: country.code.replace('+', '') });
      if (response.status === 'success') {
        toast(response.message);
        setSearchParam('key', response.data);
        setSearchParam('step', 2);
        setTimeout(() => {
          showOtpStep(maskedFromMessage(response.message, country.code, mobile));
          setResendSending(false);
          setResendSeconds(OTP_RESEND_DEFAULT_SECONDS);
        }, 500);
      } else {
        toast(response.error);
        setSending(false);
        const pendingSeconds = parseInt(response.data, 10);
        if (!Number.isNaN(pendingSeconds) && pendingSeconds > 0) {
          showOtpStep(maskMobile(country.code, mobile));
          setResendSending(false);
          setResendSeconds(pendingSeconds);
        } else if (isResend) {
          setResendSending(false);
          setResendSeconds(0);
        }
      }
    } catch (err) {
      toast(err?.message || 'Something went wrong');
      setSending(false);
      if (isResend) { setResendSending(false); setResendSeconds(0); }
    }
  }

  function handleResendOTP() {
    setResendSending(true);
    sendOTP(true);
  }

  async function processLogin() {
    const key = getSearchParam('key');
    if (!(country.regex.test(mobile) && key)) {
      toast('Something went wrong');
      return;
    }
    const code = otp.join('');
    if (code.length !== OTP_LENGTH) {
      toast('Please enter all 4 digits of one-time passcode');
      otpRefs.current[3]?.focus();
      return;
    }
    setVerifying(true);
    try {
      const response = await login({ mobile, countryCode: country.code.replace('+', ''), passcode: code, key });
      if (response.status === 'success') {
        warnBeforeLeave.current = false;
        setToken(response.data);
        setVerifying(false);
        navigate(redirectPath(), { replace: true });
      } else {
        toast(response.error ?? 'Something went wrong');
        setVerifying(false);
        otpRefs.current[3]?.focus();
      }
    } catch (err) {
      toast(err?.message || 'Something went wrong');
      setVerifying(false);
      otpRefs.current[3]?.focus();
    }
  }

  function handleOtpInput(index, e) {
    const value = e.target.value.replace(/\D/g, '').slice(-1);
    setOtp((current) => { const next = [...current]; next[index] = value; return next; });
    if (value.length === 1 && index < OTP_LENGTH - 1) otpRefs.current[index + 1]?.focus();
  }

  function handleOtpKeyDown(index, e) {
    if (e.key === 'Backspace' && otp[index].length === 0 && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  const buttonLabel = country.code === '+91' ? 'Get OTP on Phone' : 'Get OTP on WhatsApp';

  return (
    <div className="cp-login">
      <header className="cp-login-brand">
        <img src="/logo/crispr-logo.svg" alt="Crispr Learning" />
      </header>

      <div className="cp-login-split">
        <WelcomeSlider />

        <div className="cp-login-card">
          {step === 'mobile' ? (
            <div>
              <h1>Login / Register</h1>
              <p className="cp-login-sub">Please enter your mobile number to continue.</p>

              <div className="cp-field">
                <label className="cp-label" htmlFor="cp-login-mobile">Mobile number</label>
                <div className="cp-phone">
                  <div className="cp-input-group">
                    <CountryCodeSelect countries={COUNTRIES} value={countryCode} onChange={handleCountryChange} />
                    <input
                      id="cp-login-mobile"
                      ref={mobileRef}
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel-national"
                      placeholder="Mobile number"
                      maxLength={country.digits}
                      value={mobile}
                      onChange={handleMobileInput}
                      onBlur={() => { if (mobile.length > 0) validateMobile(mobile); }}
                      onKeyDown={(e) => { if (e.key === 'Enter') sendOTP(); }}
                      required
                    />
                  </div>
                </div>
              </div>

              <button type="button" className="cp-btn cp-btn-primary cp-btn-block continue-btn" onClick={() => sendOTP()} disabled={sending}>
                <span>{buttonLabel}</span>
                {sending && <span className="cp-btn-loader"><div className="loader" /></span>}
              </button>
            </div>
          ) : (
            <div>
              <h2>Continue <span>{masked}</span></h2>
              <p className="cp-login-sub">Please enter the one-time passcode.</p>
              <div className="cp-otp">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    className="otpEntry"
                    type="tel"
                    inputMode="numeric"
                    maxLength={1}
                    aria-label={`OTP digit ${i + 1}`}
                    value={digit}
                    onChange={(e) => handleOtpInput(i, e)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    required
                  />
                ))}
              </div>
              {resendSeconds !== null && (
                <button
                  type="button"
                  className="resend-btn cp-link"
                  onClick={handleResendOTP}
                  disabled={resendSending || resendSeconds > 0}
                  style={{ display: 'inline-block' }}
                >
                  {resendSending ? 'Sending...' : resendSeconds > 0 ? formatResendCountdown(resendSeconds) : 'Resend OTP'}
                </button>
              )}

              <button type="button" className="cp-btn cp-btn-primary cp-btn-block continue-btn" onClick={processLogin} disabled={verifying}>
                <span>Login Now</span>
                {verifying && <span className="cp-btn-loader"><div className="loader" /></span>}
              </button>
            </div>
          )}

          <div className="cp-field-error">
            <p>{mobileError}</p>
          </div>

          <p className="cp-login-terms">
            By continuing you agree to all our <a href="https://crisprlearning.com/terms-and-conditions/" target="new">Terms and Conditions</a>
          </p>
        </div>
      </div>
    </div>
  );
}
