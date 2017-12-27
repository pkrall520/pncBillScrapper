
// Example:
// Pnc.connect().catch((err) => {
//   console.error(err);
// });

const fetch = require('node-fetch');
const config = require('./pncInfo.json');

const statuses = {
  NOT_CONNECTED: 'NOT_CONNECTED',
  CONNECTED: 'CONNECTED',
};
const baseUrl = config.host;
const { appKey } = config;
let cookies = null;
let status = statuses.NOT_CONNECTED;

const userNPassAuth = () => new Promise((resolve) => {
  const url = `${baseUrl}/api/v1/authentication/users/valid`;
  const reqInfo = {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      userId: config.username,
      password: config.password,
      'X-App-Key': appKey,
    },
  };

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
  const reqInfo = {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      Cookie: cookies,
      answer,
      'X-App-Key': appKey,
    },
  };
  if (!answer) {
    resolve({ error: true, errMsg: `Did not find sec ques "${state.securityQuestion}"` });
  } else {
    if (state.challengeState !== 'ALLOW' && state.challengeState !== 'AUTHENTICATED') {
      return fetch(url, reqInfo).then(res => res.json())
        .then((json) => {
          if (json.authStatus === 'AUTHENTICATED') {
            resolve({ error: false });
          }
          resolve({ error: true, errMsg: `Invalid auth status ${json.authStatus}` });
        });
    }
    resolve({ error: false, isAuth: true });
  }
  return null;
});

const Pnc = {
  status,
  connect: () => new Promise((resolve, reject) => {
    userNPassAuth().then((userJson) => {
      if (userJson.error) {
        status = statuses.NOT_CONNECTED;
        reject(new Error(`User Id Auth: ${userJson.errMsg}`));
      }
      if (!userJson.isAuth) {
        challengeQuesAuth(userJson).then((quesJson) => {
          if (quesJson.error) {
            status = statuses.NOT_CONNECTED;
            reject(new Error(`Challenge Ques Auth: ${quesJson.errMsg}`));
          }
          status = statuses.CONNECTED;
        });
      }
      status = statuses.CONNECTED;
    });
  }),
};

module.exports = Pnc;
