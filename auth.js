// ===== UI要素 =====
const btn = document.querySelector("button");
const spinner = document.getElementById("spinner");
const status = document.getElementById("status");
const bar = document.getElementById("progress");

// ===== ユーティリティ =====
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

// ===== メイン認証フロー =====
async function startAuth(){

  if (!btn) return;

  btn.disabled = true;
  spinner.style.display = "block";

  try {
    // -------------------------
    // ① ログイン試行
    // -------------------------
    setState("認証を開始しています...", 10);

    await navigator.credentials.get({
      publicKey: {
        challenge: enc("login"),
        userVerification: "required"
      }
    });

    // 成功
    setState("認証成功。ログイン中...", 80);

    sessionStorage.setItem("auth","true");

    setTimeout(()=>{
      setState("完了", 100);
      location.href = "home.html";
    }, 700);

  } catch (e) {

    console.log("get失敗 → 登録へ", e);

    setState("初回ユーザー検出。登録に切り替えます...", 30);

    try {
      // -------------------------
      // ② 登録フロー
      // -------------------------
      await navigator.credentials.create({
        publicKey: {
          challenge: enc("register"),
          rp: { name: "MyApp" },
          user: {
            id: enc("user1"),
            name: "user",
            displayName: "User"
          },
          pubKeyCredParams: [
            { type: "public-key", alg: -7 }
          ],
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

      console.log("create失敗", err);

      setState("エラーが発生しました。再試行してください", 0);

      // ★ 文鎮化防止（重要）
      btn.disabled = false;
      spinner.style.display = "none";
    }
  }
}

// ===== ボタン接続 =====
document.addEventListener("DOMContentLoaded", () => {
  if (btn) btn.onclick = startAuth;
});
