const httpStatusCodes = {
  401: (responseStatus, link) => `${responseStatus}: You a not authorized at ${link}`,
  404: (responseStatus, link) => `${responseStatus}: Page '${link}' not found`,
  403: (responseStatus, link) => `${responseStatus}: Access denied at '${link}'`,
  408: (responseStatus, link) => `${responseStatus}: Request timed out at '${link}'`,
  429: (responseStatus, link) => `${responseStatus}: Too many requests at '${link}'`,
};

const systemCodes = {
  ENOTFOUND: (code) => `${code}: Incorrect URL!`,
  ENOTDIR: (code, path) => `${code}: '${path}' is not a directory`,
};

export default (err) => {
  if (err.response) {
    const { message, response: { status: statusCode, config: { url: link } } } = err;
    const choosenStatusCode = httpStatusCodes[statusCode];
    const defaultMessage = message;
    return choosenStatusCode ? choosenStatusCode(statusCode, link) : defaultMessage;
  }
  const { message, code, path } = err;
  const choosenSystemCode = systemCodes[code];
  const defaultMessage = message;
  return choosenSystemCode ? choosenSystemCode(code, path) : defaultMessage;
};
