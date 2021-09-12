/* This module is indented to be as non-magical as possible,
   that's why it just injects some HTML and CSS.
 */

import imgURL from '@/assets/500.jpeg';

export default function error500(reason) {
  const head = document.getElementsByTagName('head')[0];
  head.insertAdjacentHTML('beforeend', `
    <style>
      body {
        background-color: rgb(100, 60, 30);
      }
      .full-width {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        width: 99.2vw;
        margin: auto;
      }
      .centered-hover {
        position: absolute;
        background-color: rgba(255, 255, 255, 0.5);
        line-height: 1.3em;
        padding: 20px;
        border-radius: 20px;
        width: auto;
      }
      @media screen and (min-width: 800px) {
        .centered-hover {
          top: 10vh;
          left: 30vw;
          right: 30vw;
        }
      }
      @media screen and (max-width: 800px) {
        .centered-hover {
          top: 20px;
          left: 20px;
          right: 20px;
        }
      }
      .monospaced {
        color: rgb(50, 50, 50);
        font-family: monospace;
      }
    </style>
  `);
  const app = document.getElementById('app');
  const moreInfo = Object.keys(reason).length > 0
    ? `because of <span class="monospaced">${JSON.stringify(reason)}</span>`
    : `because of <span class="monospaced">${reason.toString()}</span>`;
  app.innerHTML = `
    <a href="https://unsplash.com/photos/NodtnCsLdTE">
      <img src="${imgURL}" class="full-width" />
    </a>
    <p class="centered-hover">
      Unfortunately, I'm having some issues today.
      Do you think you could manage on you own for a while?
      Could you also
        <a href="https://github.com/Procrat/eva-web/issues/new">let my developer know</a>
      what happened? Tell him that loading the API failed ${moreInfo}.
      He might know what's up. Thanks!
    </p>
  `;
}
