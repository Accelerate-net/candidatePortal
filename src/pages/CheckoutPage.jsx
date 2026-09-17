import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Icon } from '../components/Icons';
import { Avatar } from '../components/ui';
import { useToast } from '../components/Toast';
import { clearToken, isAuthenticated, setToken } from '../lib/auth';
import {
  acknowledgePurchase, authenticate, getBillingAddress, getProfile, login, lookupCourse, processPurchase, validateCart,
} from '../lib/candidateApi';
import {
  addCourseToCart, clearCheckoutData, forgetCouponCode, getCouponCode, rememberCouponCode, removeFromCart, retrieveCart, saveCart,
} from '../lib/cart';
import { getSearchParam, loadScript, replaceSearchParam, setSearchParam } from '../lib/browser';
import { formatAmount } from '../lib/format';
import '../styles/pages/checkout.css';

const RAZORPAY_JS = 'https://checkout.razorpay.com/v1/checkout.js';
const DEFAULT_COURSE_PIC = 'https://img.icons8.com/color/96/book.png';
const DEFAULT_TEST_PIC = 'https://img.icons8.com/color/96/system-information.png';
const INDIAN_MOBILE = /^[6-9]\d{9}$/;
const BILLING_FIELDS = ['fullname', 'address', 'locality', 'city', 'state', 'pincode', 'email'];

function cartImage(item) {
  if (item.displayImage) return item.displayImage;
  return item.type === 'Test Series' ? DEFAULT_TEST_PIC : DEFAULT_COURSE_PIC;
}

function maskedMobile(mobile) {
  if (typeof mobile !== 'string' || mobile.length !== 10) return '';
  const d = mobile.split('');
  d[2] = 'X'; d[3] = 'X'; d[5] = 'X'; d[6] = 'X';
  return d.join('');
}

const clean = (v) => (!v || v === 'undefined' ? '' : v);

/**
 * Secure checkout: local cart (see lib/cart.js), optional login by OTP,
 * billing address, gift code, and Razorpay payment.
 */
export default function CheckoutPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [verified, setVerified] = useState(null);
  const [emptyCart, setEmptyCart] = useState(false);
  const [step, setStep] = useState('mobile'); // 'mobile' | 'otp' | 'loggedIn'
  const [mobile, setMobile] = useState('');
  const [mobileError, setMobileError] = useState('');
  const [masked, setMasked] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [loggedInName, setLoggedInName] = useState('');
  const [photo, setPhoto] = useState(null); // null = not loaded yet
  const [gender, setGender] = useState(''); // picks the default picture when there is no photo
  const [registeredMobile, setRegisteredMobile] = useState('');
  const [billing, setBilling] = useState({ fullname: '', address: '', locality: '', city: '', state: '', pincode: '', email: '' });
  const [code, setCode] = useState('');
  const otpRefs = useRef([]);
  const fullnameRef = useRef(null);

  useEffect(() => { document.title = 'Crispr Secure Checkout'; }, []);

  // ── Cart ──────────────────────────────────────────────────────────────
  const renderCartForUser = useCallback(async () => {
    const myCart = retrieveCart();
    setCart(myCart);
    if (myCart.length === 0) { setEmptyCart(true); setVerified(null); return; }
    setEmptyCart(false);
    if (!isAuthenticated()) { setVerified(null); return; }
    try {
      const res = await validateCart({ cart: myCart, code: getCouponCode() });
      if (res.status === 'success') {
        setVerified(res.data);
      } else {
        saveCart([]);
        setCart([]);
        setEmptyCart(true);
        toast(res.message);
      }
    } catch (err) {
      toast(err?.message || 'Something went wrong');
    }
  }, [toast]);

  useEffect(() => {
    (async () => {
      const itemId = getSearchParam('addItem');
      if (itemId) {
        try {
          const res = await lookupCourse(itemId);
          if (res.status === 'success' && res.data && res.data.code === itemId) addCourseToCart(res.data);
          else toast('Course selected is invalid or no more available for purchase');
        } catch {
          toast('Course selected is invalid or no more available for purchase');
        }
        replaceSearchParam('addItem', null);
      }
      await renderCartForUser();
    })();
  }, [renderCartForUser, toast]);

  // ── Session ───────────────────────────────────────────────────────────
  const fillBilling = useCallback((details = {}) => {
    const name = details.name && details.name !== 'Crisprite' ? clean(details.name) : '';
    setLoggedInName(name);
    setBilling({
      fullname: name,
      address: clean(details.address),
      locality: clean(details.locality),
      city: clean(details.city),
      state: clean(details.state),
      pincode: clean(details.pincode),
      email: clean(details.email),
    });
  }, []);

  useEffect(() => {
    if (!isAuthenticated()) { setLoading(false); return; }
    getBillingAddress()
      .then((res) => {
        if (res.status === 'success') {
          setStep('loggedIn');
          setRegisteredMobile(res.data.mobile);
          fillBilling(res.data);
          setTimeout(() => fullnameRef.current?.focus(), 0);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [fillBilling]);

  // Profile photo for the "Logged in as" header (billing details carry no photo).
  useEffect(() => {
    if (step !== 'loggedIn') return;
    getProfile().then((p) => { setGender(p?.gender || ''); setPhoto(p?.photo || ''); }).catch(() => setPhoto(''));
  }, [step]);

  function logoutCurrentUser() {
    clearToken();
    window.location.reload();
  }

  async function sendOTP() {
    setSearchParam('step', 1);
    if (!INDIAN_MOBILE.test(mobile)) { toast('Enter a valid mobile number'); return; }
    setSending(true);
    try {
      const res = await authenticate({ mobile });
      if (res.status === 'success') {
        toast(res.message);
        setSearchParam('key', res.data);
        setSearchParam('step', 2);
        setTimeout(() => {
          setSending(false);
          setStep('otp');
          setMasked(`as ${maskedMobile(mobile)}`);
          setTimeout(() => otpRefs.current[0]?.focus(), 0);
        }, 500);
      } else {
        toast(res.error);
        setSending(false);
      }
    } catch (err) {
      toast(err?.message || 'Something went wrong');
      setSending(false);
    }
  }

  async function processLogin() {
    const key = getSearchParam('key');
    if (!(INDIAN_MOBILE.test(mobile) && key)) { toast('Something went wrong'); return; }
    const passcode = otp.join('');
    if (passcode.length !== 4) { toast('Please enter all 4 digits of one-time passcode'); otpRefs.current[3]?.focus(); return; }
    setVerifying(true);
    try {
      const res = await login({ mobile, passcode, key });
      if (res.status === 'success') {
        setToken(res.data);
        setVerifying(false);
        setStep('loggedIn');
        setRegisteredMobile(mobile);
        setTimeout(() => fullnameRef.current?.focus(), 0);
        getBillingAddress().then((b) => { if (b.status === 'success') fillBilling(b.data); }).catch(() => {});
        renderCartForUser();
      } else {
        toast(res.error ?? 'Something went wrong');
        setVerifying(false);
        otpRefs.current[3]?.focus();
      }
    } catch (err) {
      toast(err?.message || 'Something went wrong');
      setVerifying(false);
    }
  }

  function handleOtpInput(index, e) {
    const value = e.target.value.replace(/\D/g, '').slice(-1);
    setOtp((c) => { const n = [...c]; n[index] = value; return n; });
    if (value.length === 1 && index < 3) otpRefs.current[index + 1]?.focus();
  }

  function handleOtpKeyDown(index, e) {
    if (e.key === 'Backspace' && otp[index].length === 0 && index > 0) otpRefs.current[index - 1]?.focus();
  }

  // ── Coupon ────────────────────────────────────────────────────────────
  const discount = verified?.summary?.discount;
  const codeApplied = discount && discount.amount > 0;

  function applyCode() {
    const trimmed = code.trim();
    if (!trimmed) return;
    rememberCouponCode(trimmed);
    renderCartForUser();
  }

  function removeCode() {
    forgetCouponCode();
    setCode('');
    renderCartForUser();
  }

  useEffect(() => { if (verified && !codeApplied) forgetCouponCode(); }, [verified, codeApplied]);

  function handleRemove(itemId) {
    removeFromCart(itemId);
    renderCartForUser();
  }

  // ── Payment ───────────────────────────────────────────────────────────
  const canPay = isAuthenticated() && step === 'loggedIn' && registeredMobile.trim() !== '' && BILLING_FIELDS.every((f) => billing[f].trim() !== '');

  async function acknowledgePayment(paymentDetails) {
    try {
      const res = await acknowledgePurchase(paymentDetails);
      if (res.status === 'success') {
        clearCheckoutData();
        toast('Your payment is successful!');
        setTimeout(() => { window.location.href = '/'; }, 2000);
      } else {
        toast(res.error || 'Something went wrong, payment was not initiated');
      }
    } catch (err) {
      toast(err?.message || 'Something went wrong, payment was not initiated');
    }
  }

  async function initiatePayment() {
    const billingAddress = { mobile: registeredMobile, name: billing.fullname, ...billing, fullname: undefined };
    delete billingAddress.fullname;
    try {
      const res = await processPurchase({ cart: retrieveCart(), discountCode: getCouponCode(), billingAddress });
      if (res.status !== 'success') { toast(res.error || 'Something went wrong, payment was not initiated'); return; }
      const paymentDetails = res.data;
      await loadScript(RAZORPAY_JS);
      const options = {
        key: paymentDetails.key,
        order_id: paymentDetails.order,
        amount: paymentDetails.amount,
        name: 'Crispr Learning',
        description: 'Payment for Course Purchase',
        image: 'https://candidate.crisprlearning.com/logo/crispr-logo-for-bright-bg.png',
        handler: (payment) => acknowledgePayment({
          orderID: paymentDetails.order,
          transactionID: payment.razorpay_payment_id,
          razorpay_order_id: payment.razorpay_order_id,
          razorpay_signature: payment.razorpay_signature,
        }),
        prefill: { name: billing.fullname, contact: registeredMobile, email: billing.email },
        notes: { 'Crispr Order #': paymentDetails.transactionId },
        theme: { color: '#016375' },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast(err?.message || 'Something went wrong, payment was not initiated');
    }
  }

  // ── Render ────────────────────────────────────────────────────────────
  const summary = verified?.summary;
  const items = verified ? verified.cart : cart;
  const localSubtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.number, 0);
  const setField = (k) => (e) => setBilling((b) => ({ ...b, [k]: e.target.value }));

  return (
    <div className="cp-checkout">
      <header className="header">
        <img src="/logo/crispr-logo.svg" alt="Crispr Learning logo" />
        <small>Secure checkout</small>
      </header>

      <div className="container" style={{ position: 'relative' }}>
        {loading && <div className="loaderScreen">Loading</div>}

        {emptyCart ? (
          <h1 className="empty-cart">
            Oho! There is nothing here, something went wrong.
            <a href="https://crisprlearning.com">Take Me Home</a>
          </h1>
        ) : (
          <>
            <section className="form-section">
              <div className="loginSection">
                {step === 'mobile' && (
                  <div>
                    <h2>Login / Register</h2>
                    <p>Please enter your mobile number to continue.</p>
                    <div className="input-group">
                      <div>🇮🇳 <b>+91</b></div>
                      <input
                        type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="Mobile number" maxLength={10} required autoFocus
                        value={mobile}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setMobile(v);
                          setMobileError(v.length === 10 && !INDIAN_MOBILE.test(v) ? 'Invalid Mobile Number' : '');
                        }}
                        onBlur={() => setMobileError(INDIAN_MOBILE.test(mobile) ? '' : 'Invalid Mobile Number')}
                      />
                    </div>
                    <button type="button" className="continue-btn" onClick={sendOTP} disabled={sending}>
                      Continue
                      {sending && <span><div className="loader" /></span>}
                    </button>
                    <div className="mobileErrorHolder"><p>{mobileError}</p></div>
                  </div>
                )}

                {step === 'otp' && (
                  <div>
                    <h2>Continue <span>{masked}</span></h2>
                    <p>Please enter the one-time passcode.</p>
                    <div className="input-group otp">
                      {otp.map((digit, i) => (
                        <input
                          key={i} ref={(el) => { otpRefs.current[i] = el; }} className="otpEntry" type="tel" inputMode="numeric" maxLength={1}
                          aria-label={`OTP digit ${i + 1}`} value={digit} onChange={(e) => handleOtpInput(i, e)} onKeyDown={(e) => handleOtpKeyDown(i, e)} required
                        />
                      ))}
                    </div>
                    <button type="button" className="continue-btn" onClick={processLogin} disabled={verifying}>
                      Login Now
                      {verifying && <span><div className="loader" /></span>}
                    </button>
                  </div>
                )}

                {step === 'loggedIn' && (
                  <div>
                    <div className="cp-checkout-user">
                      <Avatar src={photo} gender={gender} pending={photo === null} />
                      <h2>
                        Logged in <span>as {loggedInName}</span>
                        <button type="button" className="logoutButton" onClick={logoutCurrentUser}>Logout</button>
                      </h2>
                    </div>
                    <div className="input-group">
                      <div>🇮🇳 <b>+91</b></div>
                      <input type="tel" value={registeredMobile} disabled readOnly />
                    </div>
                  </div>
                )}
              </div>

              {step === 'loggedIn' && (
                <div className="addressSection">
                  <h2>Billing Address</h2>
                  <p>We need these details for your invoice.</p>
                  <div className="billing-group">
                    <input ref={fullnameRef} type="text" placeholder="Full Name" value={billing.fullname} onChange={setField('fullname')} />
                  </div>
                  <div className="billing-group">
                    <input type="text" placeholder="Address" value={billing.address} onChange={setField('address')} />
                    <input type="text" placeholder="Locality or Landmark" value={billing.locality} onChange={setField('locality')} />
                  </div>
                  <div className="billing-group">
                    <input type="text" placeholder="City" value={billing.city} onChange={setField('city')} />
                    <input type="text" placeholder="State" value={billing.state} onChange={setField('state')} />
                    <input type="tel" placeholder="Pincode" maxLength={6} value={billing.pincode} onChange={setField('pincode')} />
                  </div>
                  <input type="text" placeholder="Email for Communication" value={billing.email} onChange={setField('email')} />
                </div>
              )}

              <section className="payment-section">
                <p>By placing this order, you agree to our <a href="https://crisprlearning.com/terms-and-conditions/" target="_blank" rel="noopener noreferrer">Terms of Service</a> and <a href="https://crisprlearning.com/refund-policy/" target="_blank" rel="noopener noreferrer">Refund Policy</a>, and understand our <a href="https://crisprlearning.com/privacy-policy/" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.</p>
              </section>
            </section>

            <section className="summary-section">
              <h2>Order Summary</h2>

              <div className="cartItems">
                {items.map((item) => (
                  <div className="summary-item" key={item.itemId}>
                    <button type="button" className="summary-item-remove" title="Remove" onClick={() => handleRemove(item.itemId)}><Icon.Trash width={15} height={15} /></button>
                    <div className="product-info">
                      <img src={cartImage(item)} alt="" />
                      <div className="product-details">
                        <span className="product-name">{item.title}</span>
                        <span className="product-size">x {item.number}</span>
                      </div>
                    </div>
                    <span className="price">₹{formatAmount(item.unitPrice)}</span>
                  </div>
                ))}
              </div>

              {verified && (
                <div className="apply-section">
                  {codeApplied ? (
                    <>
                      <input type="text" placeholder="Gift card or discount code" value={discount.code || ''} disabled readOnly />
                      <button type="button" className="apply-btn" onClick={removeCode}>Remove</button>
                    </>
                  ) : (
                    <>
                      <input type="text" placeholder="Gift card or discount code" value={code} onChange={(e) => setCode(e.target.value)} />
                      <button type="button" className="apply-btn" onClick={applyCode}>Apply</button>
                    </>
                  )}
                </div>
              )}

              <div className="cartSummary">
                {summary ? (
                  <>
                    <div className="summary-item"><span>Subtotal</span><span>₹{formatAmount(summary.subTotal)}</span></div>
                    {summary.discount.amount > 0 && <div className="summary-item"><span>Discounts</span><span>-₹{formatAmount(summary.discount.amount)}</span></div>}
                    {(summary.taxes || []).map((t) => <div className="summary-item" key={t.label}><span>{t.label}</span><span>₹{formatAmount(t.value)}</span></div>)}
                    {(summary.extras || []).map((t) => <div className="summary-item" key={t.label}><span>{t.label}</span><span>₹{formatAmount(t.value)}</span></div>)}
                    <div className="summary-item total"><span>Total</span><span className="price">₹{formatAmount(summary.totalPayable)}</span></div>
                  </>
                ) : (
                  <>
                    <div className="summary-item"><span>Subtotal</span><span>₹{formatAmount(localSubtotal)}</span></div>
                    <div className="summary-item total"><span>Total</span><span className="price">₹{formatAmount(localSubtotal)}<span className="superscript">†</span></span></div>
                    <div className="summary-item is-note"><span>Taxes and other charges if applicable, would be computed once user validates their mobile number. Please authenticate your mobile number to redeem Gift Codes<span className="superscript">†</span></span></div>
                  </>
                )}
              </div>

              <button type="button" className="pay-btn" disabled={!canPay} onClick={initiatePayment} aria-describedby={canPay ? undefined : 'pay-hint'}>Pay Now</button>
              {!canPay && (
                <p id="pay-hint" className="pay-hint">
                  {step === 'loggedIn' ? 'Please add your billing address to proceed.' : 'Please verify your mobile number to proceed.'}
                </p>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
