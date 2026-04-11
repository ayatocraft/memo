const spinner = document.getElementById("spinner");
const status = document.getElementById("status");
const bar = document.getElementById("progress");

function enc(str){
  return new TextEncoder().encode(str);
}

function setProgress(p){
  bar.style.width = p + "%";
}

function setState(text, p){
  status.textContent = text;
  setProgress(p);
}

async function startAuth(){

  spinner.style.display = "block";

  try {
    // ① 試行
    setState("認証を開始しています...", 10);

    await navigator.credentials.get({
      publicKey: {
        challenge: enc("login"),
        userVerification: "required"
      }
    });

    // 成功
    setState("認証成功。ログインしています...", 80);

    sessionStorage.setItem("auth","true");

    setTimeout(()=>{
      setState("完了", 100);
      location.href = "home.html";
    }, 800);

  } catch (e) {

    // ② フォールバック
    setState(初期状態であることが検知されました。登録しています...", 30);

    try {
      await navigator.credentials.create({
        publicKey: {
          challenge: enc("register"),
          rp: { name: "MyApp" },
          user: {
            id: enc("user1"),
            name: "user",
            displayName: "User"
          },
          pubKeyCredParams: [{ alg: -7, type: "public-key" }],
          authenticatorSelection: {
            userVerification: "required"
          }
        }
      });

      setState("登録完了。ログイン中...", 90);
      sessionStorage.setItem("auth","true");

      setTimeout(()=>{
        setProgress(100);
        location.href = "home.html";
      }, 700);

    } catch (err) {
      console.log(err);
      setState("エラーが発生しました", 0);
      spinner.style.display = "none";
    }
  }
}
