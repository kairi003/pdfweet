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
  if (document.querySelectorAll('img.twitter-icon').length) postTweet.disabled = false;
  dlBtn.disabled = false;
  msgblock.textContent = "";
};

const pdf_input = async () => {
  const pdf_file = pdfFile.files[0];
  const pdf_url = URL.createObjectURL(pdf_file);
  const pdf_password = pdfPassword.value;
  pdf_load(pdf_url, pdf_password);
}


document.getElementById('pdfSubmit').addEventListener('click', pdf_input);


document.getElementById('pdfFile').addEventListener('change', e => {
  pdfFileLabel.textContent = e.target.files[0].name;
});

