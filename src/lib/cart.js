// Shopping cart kept in localStorage under the same keys the previous
// checkout page used, so a cart started before the React move still loads.
//
// Cart item shape: { itemId, title, type, unitPrice (paise), number }
const CART_KEY = 'crisprCart';
const CODE_KEY = 'crisprCartDiscountCode';

export function retrieveCart() {
  const stored = window.localStorage.getItem(CART_KEY);
  if (!stored) {
    window.localStorage.setItem(CART_KEY, JSON.stringify([]));
    return [];
  }
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCart(items) {
  window.localStorage.setItem(CART_KEY, JSON.stringify(items));
}

export function rememberCouponCode(code) {
  window.localStorage.setItem(CODE_KEY, code);
}

export function forgetCouponCode() {
  window.localStorage.setItem(CODE_KEY, '');
}

export function getCouponCode() {
  return window.localStorage.getItem(CODE_KEY) || '';
}

export function clearCheckoutData() {
  window.localStorage.removeItem(CODE_KEY);
  window.localStorage.removeItem(CART_KEY);
}

// Add a validated course to the cart. Courses and test series are limited to
// one each; anything else increments its count.
export function addCourseToCart(course) {
  forgetCouponCode();
  const cart = retrieveCart();
  const found = cart.find((item) => item.itemId === course.code);
  if (found) {
    if (found.type !== 'Course' && found.type !== 'Test Series') found.number += 1;
  } else {
    cart.push({
      itemId: course.code,
      title: course.title,
      type: course.type,
      unitPrice: course.sellingPrice,
      number: 1,
    });
  }
  saveCart(cart);
  return cart;
}

export function removeFromCart(itemId) {
  forgetCouponCode();
  const cart = retrieveCart().filter((item) => item.itemId !== itemId);
  saveCart(cart);
  return cart;
}
