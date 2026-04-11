const msg = document.getElementById("msg");

function enc(str){
  return new TextEncoder().encode(str);
}

// ===== パスキー認証 =====
async function doAuth() {
  try {
    await navigator.credentials.get({
      publicKey: {
        challenge: enc("login"),
        userVerification: "required",
        timeout: 60000
      }
    });

    // 👉 セッション保存（ここが重要）
    sessionStorage.setItem("auth", "true");

    location.href = "home.html";

  } catch (e) {
    console.log(e);
    msg.textContent = "認証に失敗しました";
  }
}

// ===== 初回登録（簡易）=====
async function register() {
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
        pubKeyCredParams: [{ type: "public-key", alg: -7 }],
        authenticatorSelection: {
          userVerification: "required"
        }
      }
    });

    return true;

  } catch (e) {
    console.log(e);
    return false;
  }
}

// ===== ボタン =====
document.getElementById("authBtn").onclick = async () => {

  msg.textContent = "認証中...";

  // 初回登録チェック
  if (!localStorage.getItem("passkey")) {
    const ok = await register();
    if (!ok) {
      msg.textContent = "登録失敗";
      return;
    }
    localStorage.setItem("passkey", "true");
  }

  await doAuth();
};
