pdfjsLib.GlobalWorkerOptions.workerSrc = '/static/scripts/pdf.worker.js';

window.blobs = [];

const pdf2canvas = async (pdf, i) => {
  const page = await pdf.getPage(i);
  const scale = 1;
  const viewport = page.getViewport({
    scale: scale,
  });
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  canvas.height = viewport.height;
  canvas.width = viewport.width;

  const renderContext = {
    canvasContext: context,
    viewport: viewport,
  };
  await page.render(renderContext);
  return canvas;
};

const pdf2blob = async (pdf, i) => {
  const canvas = await pdf2canvas(pdf, i);
  const blob = await new Promise(resolve => canvas.toBlob(resolve));
  return blob;
};

const pdf2img = async (pdf, i) => {
  const blob = await pdf2blob(pdf, i);
  const img = Object.assign(new Image(), {
    className: 'page-img',
    src: URL.createObjectURL(blob)
  });
  return img;
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
  for (let img of document.querySelectorAll('.page-img')) img.parentNode.removeChild(img);
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
  const pdfview = document.getElementById('pdfView');
  for (let blob of window.blobs) {
    let img = blob2img(blob);
    img.className = 'pdf-image';
    const viewitem = Object.assign(document.createElement('li'), {
      class: 'view-item'
    });
    viewitem.append(img);
    pdfview.append(viewitem);
  }
};

const pdf_input = async () => {
  const pdf_file = pdfFile.files[0];
  const pdf_url = URL.createObjectURL(pdf_file);
  const pdf_password = pdfPassword.value;
  pdf_load(pdf_url, pdf_password);  
}

pdfFile.addEventListener('change', pdf_input);
pdfPassword.addEventListener('change', pdf_input);
postTweet.addEventListener('click', ()=>{
  if (window.blobs.length == 0) return false;
  const formData = new FormData();
  for (let i in window.blobs) formData.append(`image[${i}]`, window.blobs[i]);
  formData.append('num', window.blobs.length.toString());
  formData.append('text', tweetText.textContent);
  fetch('/tweet', {method: 'POST', body: formData});
})
