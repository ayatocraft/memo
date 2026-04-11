const btn = document.getElementById("authBtn");
const spinner = document.getElementById("spinner");
const status = document.getElementById("status");
const bar = document.getElementById("progress");
const check = document.getElementById("check");

function enc(str){
  return new TextEncoder().encode(str);
}

function setProgress(p){
  bar.style.width = p + "%";
}

function setState(text, p){
  status.textContent = text;
  setProgress(p ?? 0);
}

function showCheck(){
  check.style.display = "block";
  check.style.transform = "scale(1.2)";

  setTimeout(()=>{
    check.style.transform = "scale(1)";
  }, 200);
}

function resetUI(){
  btn.disabled = false;
  spinner.style.display = "none";
}

async function startAuth(){

  if (!btn) return;

  btn.disabled = true;
  spinner.style.display = "block";
  check.style.display = "none";

  try {

    // ======================
    // ① ログイン試行
    // ======================
    setState("認証中...", 10);

    const loginPromise = navigator.credentials.get({
      publicKey: {
        challenge: enc("login"),
        userVerification: "required"
      }
    });

    const timeout = new Promise((_, reject)=>{
      setTimeout(()=>reject("timeout"), 8000);
    });

    await Promise.race([loginPromise, timeout]);

    // 成功
    setState("認証成功", 70);
    showCheck();

    sessionStorage.setItem("auth","true");

    setTimeout(()=>{
      setState("遷移中...", 100);
      location.href = "home.html";
    }, 700);

  } catch (e) {

    console.log("login失敗 → 登録へ", e);

    try {

      setState("初回ユーザー検出", 30);

      const regPromise = navigator.credentials.create({
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

      const timeout2 = new Promise((_, reject)=>{
        setTimeout(()=>reject("timeout"), 10000);
      });

      await Promise.race([regPromise, timeout2]);

      setState("登録完了", 80);
      showCheck();

      sessionStorage.setItem("auth","true");

      setTimeout(()=>{
        location.href = "home.html";
      }, 700);

    } catch (err) {

      console.log("register失敗", err);

      // ======================
      // ★絶対復帰保証
      // ======================
      setState("エラー：再試行してください", 0);
      resetUI();
    }
  }
}

// 安全起動
document.addEventListener("DOMContentLoaded", ()=>{
  if (btn) btn.addEventListener("click", startAuth);
});
