const btn = document.getElementById("authBtn");
const status = document.getElementById("status");
const spinner = document.getElementById("spinner");

function enc(str){
  return new TextEncoder().encode(str);
}

async function doAuth(){

  // UI切替
  btn.disabled = true;
  spinner.style.display = "block";
  status.textContent = "認証を開始しています...";

  try {
    status.textContent = "デバイス認証を実行中...";

    await navigator.credentials.get({
      publicKey: {
        challenge: enc("login"),
        userVerification: "required",
        timeout: 60000
      }
    });

    status.textContent = "認証成功。アプリを準備しています...";

    sessionStorage.setItem("auth","true");

    // 少し“間”を作る（アプリ感）
    setTimeout(()=>{
      window.location.href = "home.html";
    }, 1200);

  } catch(e){
    console.log(e);

    spinner.style.display = "none";
    btn.disabled = false;

    status.textContent = "認証に失敗しました。もう一度お試しください。";
  }
}

btn.onclick = doAuth;
