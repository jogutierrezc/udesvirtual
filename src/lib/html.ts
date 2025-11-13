import DOMPurify from 'dompurify';

// Sanitize lesson HTML and convert limited style-based alignment into Tailwind classes.
export function sanitizeLessonHtml(html: string | null | undefined): string {
  if (!html) return '';

  // Allow the style attribute temporarily so we can extract text-align values.
  const preserved = DOMPurify.sanitize(html, { ADD_ATTR: ['style'] });

  // Parse and map styles to utility classes we control.
  const parser = new DOMParser();
  const doc = parser.parseFromString(preserved, 'text/html');

  // Map style="text-align: ..." to Tailwind classes and remove the style text-align
  const styled = doc.querySelectorAll('[style]');
  styled.forEach((el) => {
    const style = el.getAttribute('style') || '';
    const m = style.match(/text-align\s*:\s*(left|center|right|justify)/i);
    if (m) {
      const align = m[1].toLowerCase();
      if (align === 'left') el.classList.add('text-left');
      else if (align === 'center') el.classList.add('text-center');
      else if (align === 'right') el.classList.add('text-right');
      else if (align === 'justify') el.classList.add('text-justify');
    }
    // remove text-align declarations from style to reduce inline styles
    const newStyle = style.replace(/text-align\s*:\s*(left|center|right|justify)\s*;?/ig, '').trim();
    if (newStyle) el.setAttribute('style', newStyle);
    else el.removeAttribute('style');
  });

  // Map Quill's ql-align-* classes to Tailwind classes
  const qlAligned = doc.querySelectorAll('[class*="ql-align-"]');
  qlAligned.forEach((el) => {
    const cls = String(el.getAttribute('class') || '');
    const match = cls.match(/ql-align-(left|center|right|justify)/);
    if (match) {
      const align = match[1];
      if (align === 'left') el.classList.add('text-left');
      else if (align === 'center') el.classList.add('text-center');
      else if (align === 'right') el.classList.add('text-right');
      else if (align === 'justify') el.classList.add('text-justify');
      // remove ql-align-* classes to avoid leaking editor CSS
      el.setAttribute('class', cls.split(/\s+/).filter(c => !c.startsWith('ql-align-')).join(' '));
    }
  });

  // Finally sanitize again to remove any remaining unsafe attributes/tags
  const cleaned = DOMPurify.sanitize(doc.body.innerHTML);
  return cleaned;
}

export default sanitizeLessonHtml;
