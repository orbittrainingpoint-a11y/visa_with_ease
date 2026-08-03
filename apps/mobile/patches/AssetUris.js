'use strict';

export function getFilename(url) {
  const { pathname, searchParams } = new URL(url, 'https://e');
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    if (searchParams.has('unstable_path')) {
      const encodedFilePath = decodeURIComponent(searchParams.get('unstable_path'));
      return getBasename(encodedFilePath);
    }
  }
  return getBasename(pathname);
}

function getBasename(pathname) {
  return pathname.substring(pathname.lastIndexOf('/') + 1);
}

export function getFileExtension(url) {
  const filename = getFilename(url);
  const dotIndex = filename.lastIndexOf('.');
  return dotIndex > 0 ? filename.substring(dotIndex) : '';
}

export function getManifestBaseUrl(manifestUrl) {
  const urlObject = new URL(manifestUrl);
  let nextProtocol = urlObject.protocol;
  if (nextProtocol === 'exp:') {
    nextProtocol = 'http:';
  } else if (nextProtocol === 'exps:') {
    nextProtocol = 'https:';
  }
  // Pure string operations — avoid URL property setters (getter-only in some RN/Hermes builds)
  let href = urlObject.href;
  if (urlObject.protocol !== nextProtocol) {
    href = nextProtocol + href.slice(urlObject.protocol.length);
  }
  const hashIdx = href.indexOf('#');
  if (hashIdx !== -1) href = href.slice(0, hashIdx);
  const queryIdx = href.indexOf('?');
  if (queryIdx !== -1) href = href.slice(0, queryIdx);
  const protocolSepIdx = href.indexOf('://');
  if (protocolSepIdx !== -1) {
    const authorityEnd = href.indexOf('/', protocolSepIdx + 3);
    if (authorityEnd !== -1) {
      const pathPart = href.slice(authorityEnd);
      const dirPart = pathPart.slice(0, pathPart.lastIndexOf('/') + 1);
      href = href.slice(0, authorityEnd) + dirPart;
    }
  }
  return href;
}
