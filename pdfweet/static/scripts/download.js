document.getElementById('dlBtn').addEventListener('click', async ()=>{
  const name = pdfFile.files[0].name;
  const zip = new JSZip();
  await Promise.all(window.blobs.map(async (blob,i)=>zip.file(`${name}[${i}].png`, blob)));
  zip.generateAsync({type:"blob"}).then(content => saveAs(content, `${name}.zip`));
});
