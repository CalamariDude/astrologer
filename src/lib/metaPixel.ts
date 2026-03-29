/**
 * Meta (Facebook) Pixel integration for ad conversion tracking.
 *
 * Set VITE_META_PIXEL_ID in your .env to enable.
 *
 * Standard events tracked:
 * - PageView: automatic on every page
 * - ViewContent: insight page viewed
 * - Lead: email submitted (birth data form)
 * - InitiateCheckout: unlock button clicked
 * - Purchase: payment completed
 */

const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID;

let initialized = false;

/** Initialize the Meta Pixel (call once in app startup) */
export function initMetaPixel() {
  if (!PIXEL_ID || initialized) return;
  initialized = true;

  // Load the pixel script
  const script = document.createElement('script');
  script.innerHTML = `
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window,document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '${PIXEL_ID}');
    fbq('track', 'PageView');
  `;
  document.head.appendChild(script);

  // Add noscript fallback
  const noscript = document.createElement('noscript');
  noscript.innerHTML = `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1"/>`;
  document.body.appendChild(noscript);
}

/** Track a standard Meta Pixel event */
function track(event: string, params?: Record<string, any>) {
  if (!PIXEL_ID) return;
  try {
    const fbq = (window as any).fbq;
    if (fbq) {
      if (params) {
        fbq('track', event, params);
      } else {
        fbq('track', event);
      }
    }
  } catch {}
}

/** Insight page viewed */
export function trackViewContent(moduleId: string) {
  track('ViewContent', {
    content_type: 'product',
    content_ids: [moduleId],
    content_name: moduleId,
    content_category: 'insight_reading',
  });
}

/** Email/birth data submitted (lead captured) */
export function trackLead(moduleId: string) {
  track('Lead', {
    content_name: moduleId,
    content_category: 'insight_reading',
  });
}

/** Unlock / checkout button clicked */
export function trackInitiateCheckout(moduleId: string, value: number = 9.99) {
  track('InitiateCheckout', {
    content_ids: [moduleId],
    content_type: 'product',
    value,
    currency: 'USD',
  });
}

/** Payment completed */
export function trackPurchase(moduleId: string, value: number = 9.99) {
  track('Purchase', {
    content_ids: [moduleId],
    content_type: 'product',
    value,
    currency: 'USD',
  });
}
