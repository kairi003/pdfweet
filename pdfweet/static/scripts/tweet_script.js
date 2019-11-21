const sleep = m => new Promise(r => setTimeout(r, m))

document.getElementById('postTweet').addEventListener('click', async () => {
  const postTweet = document.getElementById('postTweet');
  const pdfSubmit = document.getElementById('pdfSubmit');
  const pdfFile = document.getElementById('pdfFile');
  [postTweet, pdfSubmit, pdfFile].forEach(e => e.disabled = true);
  const msgblock = document.getElementById('msgblock');
  msgblock.textContent = "Tweet Sending...";
  if (window.blobs.length == 0) {
    alert('PDFファイルがありません');
  } else if (count.style.color == 'red') {
    alert('ツイートが最大文字数を超えています');
  } else {
    const formData = new FormData(document.getElementById('tweetForm'));
    formData.set('n', parseInt(window.blobs.length.toString() / 4) + 1);
    let preId = '-1';
    for (let i = 0; i < window.blobs.length / 4; i++) {
      for (let j = 0; j < 4; j++) formData.set(`image[${j}]`, window.blobs[4 * i + j] || '');
      formData.set('preId', preId);
      formData.set('i', i + 1);
      response = await fetch('/tweet2', {
        method: 'POST',
        body: formData
      }).then(r => r.json());
      if (response.success) {
        preId = response.id;
      } else {
        console.log(response.error);
        alert(`ERROR: ${response.error}`);
        break;
      }
      if (i === 0) {
        document.getElementById('tweetView').insertAdjacentHTML('afterbegin', `<blockquote class="twitter-tweet"><a href="https://twitter.com/imascg_stage/status/${preId}"></a></blockquote>`);
        window.twirender();
      }
      sleep(1000);
    }
    alert('ツイート完了');
  }
  [postTweet, pdfSubmit, pdfFile].forEach(e => e.disabled = false);
  msgblock.textContent = "";
  return false;
})


const updateCount = () => {
  const count = document.getElementById('count');
  const str = document.getElementById('tweetText').value;
  const twitter_length = twttr.txt.getTweetLength(str) / 2;
  count.textContent = twitter_length;
  if (twitter_length < 140) count.style.color = 'gray';
  else count.style.color = 'red';
};

updateCount();

document.getElementById('tweetText').addEventListener('keyup', updateCount);