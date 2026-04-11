document.getElementById("authBtn").onclick = async () => {
  try {
    const credential = await navigator.credentials.get({
      publicKey: {
        challenge: new Uint8Array([1,2,3,4]),
        timeout: 60000,
        userVerification: "required"
      }
    });

    // 認証成功フラグ
    localStorage.setItem("auth", "true");

    // homeへ
    window.location.href = "home.html";

  } catch (e) {
    alert("認証に失敗しました");
    console.log(e);
  }
};
