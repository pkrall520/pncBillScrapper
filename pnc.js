
// Example:
// Pnc.connect().catch((err) => {
//   console.error(err);
// });

const fetch = require('node-fetch');
const config = require('./pncInfo.json');

const Statuses = {
  NOT_CONNECTED: 'NOT_CONNECTED',
  CONNECTED: 'CONNECTED',
};
const Type = {
  CREDIT: 'creditcard',
  DEBT: 'checking',
};

const baseUrl = config.host;
const { appKey } = config;
let cookies = null;
let status = Statuses.NOT_CONNECTED;

const getHeaders = () => ({
  method: 'GET',
  credentials: 'same-origin',
  headers: {
    Cookie: cookies,
    'X-App-Key': appKey,
  },
});
const postHeaders = () => {
  const hdrs = getHeaders();
  hdrs.method = 'POST';
  return hdrs;
};

const userNPassAuth = () => new Promise((resolve) => {
  const url = `${baseUrl}/api/v1/authentication/users/valid`;
  const reqInfo = postHeaders();
  reqInfo.headers.userId = config.username;
  reqInfo.headers.password = config.password;
  delete reqInfo.headers.Cookie;

  let headers = null;
  return fetch(url, reqInfo).then((res) => {
    headers = res.headers.raw();
    return res.json();
  }).then((json) => {
    const challengeState = json.authStatus;
    const { securityQuestion } = json;
    if (challengeState === 'AUTHENTICATED' || challengeState === 'CHALLENGE') {
      if (headers['set-cookie']) {
        cookies += headers['set-cookie'].join(';');
      }
      if (challengeState === 'AUTHENTICATED') {
        resolve({
          error: false,
          isAuth: true,
        });
      }
    } else {
      resolve({
        challengeState,
        securityQuestion,
        error: true,
        errMsg: 'Didn\'t come back right from challenge',
      });
    }
    resolve({ challengeState, securityQuestion, error: false });
  });
});

const challengeQuesAuth = state => new Promise((resolve) => {
  const url = `${baseUrl}/api/v1/authentication/securityQuestions/valid`;
  const answer = config.challenge[state.securityQuestion];
  const reqInfo = postHeaders();
  reqInfo.headers.answer = answer;

  if (!answer) {
    resolve({ error: true, isAuth: false, errMsg: `Did not find sec ques "${state.securityQuestion}"` });
  } else {
    if (state.challengeState !== 'ALLOW' && state.challengeState !== 'AUTHENTICATED') {
      return fetch(url, reqInfo).then(res => res.json())
        .then((json) => {
          if (json.authStatus === 'AUTHENTICATED') {
            resolve({ error: false, isAuth: true });
          }
          resolve({ error: true, errMsg: `Invalid auth status ${json.authStatus}` });
        });
    }
    resolve({ error: false, isAuth: true });
  }
  return null;
});

const query = (type, date) => new Promise((resolve, reject) => {
  if (status === Statuses.NOT_CONNECTED) {
    reject(new Error('Not connected to PNC. Use Connect function'));
  }
  if (type !== Type.CREDIT && type !== Type.DEBT) {
    reject(new Error('Invalid Account Type Type'));
  }

  if (date.match(/[0-9]{4}-[0-9]{2}-[0-9]{2}/g)) {
    reject(new Error('Invalid Date: Need to match format YYYY-MM-DD'));
  }

  const url = `/vw/v3/categorized/transactions/${type}/${date}/${date}`;
  const reqInfo = getHeaders();
  return fetch(url, reqInfo).then(res => res.json())
    .then((data) => {
      resolve({ error: false, data });
    });
});

const Pnc = {
  status,
  query,
  connect: () => new Promise((resolve, reject) => {
    userNPassAuth().then((userJson) => {
      if (userJson.error) {
        status = Statuses.NOT_CONNECTED;
        reject(new Error(`User Id Auth: ${userJson.errMsg}`));
      }
      if (!userJson.isAuth) {
        challengeQuesAuth(userJson).then((quesJson) => {
          if (quesJson.error) {
            status = Statuses.NOT_CONNECTED;
            reject(new Error(`Challenge Ques Auth: ${quesJson.errMsg}`));
          }

          status = quesJson.isAuth ? Statuses.CONNECTED : Statuses.NOT_CONNECTED;
          resolve();
        });
      } else {
        status = Statuses.CONNECTED;
        resolve();
      }
    });
  }),
};

module.exports = { Pnc, Statuses, Type };
