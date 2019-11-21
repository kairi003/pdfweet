pdfjsLib.GlobalWorkerOptions.workerSrc = '/static/scripts/pdf.worker.min.js';

window.blobs = [];

const pdf2canvas = async (pdf, i) => {
  const page = await pdf.getPage(i);
  const scale = 2;
  const viewport = page.getViewport({
    scale
  });
  const canvas = document.createElement('canvas');
  const canvasContext = canvas.getContext('2d');

  canvas.height = viewport.height;
  canvas.width = viewport.width;

  const renderContext = {
    canvasContext,
    viewport
  };
  await page.render(renderContext);
  return canvas;
};

const pdf2blob = async (pdf, i) => {
  const canvas = await pdf2canvas(pdf, i);
  const blob = await new Promise(resolve => canvas.toBlob(resolve));
  return blob;
};

const blob2img = blob => {
  const img = Object.assign(new Image(), {
    className: 'page-img',
    src: URL.createObjectURL(blob)
  });
  return img;
};

const pdf_load = async (url, password) => {
  window.blobs = [];
  const postTweet = document.getElementById('postTweet');
  postTweet.disabled = true;
  const dlBtn = document.getElementById('dlBtn');
  dlBtn.disabled = true;
  const msgblock = document.getElementById('msgblock');
  msgblock.textContent = "PDF Loading...";
  const pdfView = document.getElementById('pdfView');
  document.querySelectorAll('.view-item').forEach(item => pdfView.removeChild(item));
  for (let img of document.querySelectorAll('.pdf-image')) img.parentNode.removeChild(img);
  const loadingTask = pdfjsLib.getDocument({
    url,
    password
  });
  const pdf = await loadingTask.promise.catch(err => err);
  if (pdf instanceof Error) {
    const err = pdf;
    window.err = err;
    if (err.name == 'PasswordException') {
      alert(err.message);
      return;
    } else {
      throw err;
    }
  }
  const range = [...Array(pdf.numPages).keys()];
  window.blobs = await Promise.all(range.map(async i => pdf2blob(pdf, i + 1)));
  for (let blob of window.blobs) {
    let img = blob2img(blob);
    img.className = 'pdf-image';
    pdfView.append(img);
  }
  postTweet.disabled = false;
  dlBtn.disabled = false;
  msgblock.textContent = "";
};

const pdf_input = async () => {
  const pdf_file = pdfFile.files[0];
  const pdf_url = URL.createObjectURL(pdf_file);
  const pdf_password = pdfPassword.value;
  pdf_load(pdf_url, pdf_password);
}

const sleep = m => new Promise(r => setTimeout(r, m))

document.getElementById('pdfSubmit').addEventListener('click', pdf_input);
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

document.getElementById('pdfFile').addEventListener('change', e => {
  pdfFileLabel.textContent = e.target.files[0].name;
});

document.getElementById('tweetText').addEventListener('keyup', updateCount);