import { useEffect } from 'react';

type Props = {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  lang?: 'ar' | 'en';
  type?: 'website' | 'article';
  noindex?: boolean;
};

const SITE_NAME = 'Al Tahany Wedding & Events';
const BASE_URL = 'https://altahany.com';
const DEFAULT_IMAGE = `${BASE_URL}/logo.png`;

export default function SEO({
  title = 'التهاني لخدمات الأفراح | Al Tahany Wedding & Events UAE',
  description = 'خدمات أفراح فاخرة في الإمارات منذ 2004. زفة، كوشة، إضاءة، دي جي، تجهيز مسرح، تنظيم فعاليات، ضيافة، وخيام. الشارقة - الإمارات.',
  keywords,
  image = DEFAULT_IMAGE,
  url = BASE_URL,
  lang = 'ar',
  type = 'website',
  noindex = false,
}: Props) {
  useEffect(() => {
    document.title = title;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

    setMeta('description', description);
    if (keywords) setMeta('keywords', keywords);
    setMeta('robots', noindex ? 'noindex,nofollow' : 'index,follow,max-image-preview:large');

    setOg('title', title);
    setOg('description', description);
    setOg('image', image);
    setOg('url', url);
    setOg('type', type);
    setOg('site_name', SITE_NAME);

    setTwitter('title', title);
    setTwitter('description', description);
    setTwitter('image', image);

    setLink('canonical', url);
  }, [title, description, keywords, image, url, lang, type, noindex]);

  return null;
}

function setMeta(name: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.name = name;
    document.head.appendChild(el);
  }
  el.content = content;
}

function setOg(property: string, content: string) {
  const attr = `og:${property}`;
  let el = document.querySelector<HTMLMetaElement>(`meta[property="${attr}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', attr);
    document.head.appendChild(el);
  }
  el.content = content;
}

function setTwitter(name: string, content: string) {
  const attr = `twitter:${name}`;
  let el = document.querySelector<HTMLMetaElement>(`meta[name="${attr}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.name = attr;
    document.head.appendChild(el);
  }
  el.content = content;
}

function setLink(rel: string, href: string) {
  let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}
