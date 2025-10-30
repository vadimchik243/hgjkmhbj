
const AIRDROP_END = "2026-01-31T23:59:59Z";
const TOKEN_SYMBOL = "NBL";
const PROJECT_NAME = "NebulaDrop";
const API_BASE = "";

const views = {
  home: document.getElementById("view-home"),
  airdrop: document.getElementById("view-airdrop"),
  token: document.getElementById("view-token"),
  faq: document.getElementById("view-faq"),
  dashboard: document.getElementById("view-dashboard"),
};

function showView(name) {
  Object.values(views).forEach(v => v.classList.remove("active"));
  if (views[name]) views[name].classList.add("active");
  history.replaceState(null, "", "#" + name);
}
document.querySelectorAll("[data-route]").forEach(el => {
  el.addEventListener("click", () => showView(el.getAttribute("data-route")));
});
if (location.hash) {
  const route = location.hash.replace("#","");
  if (views[route]) showView(route);
}

let provider, signer, userAddress = null;
const connectBtn = document.getElementById("connectBtn");
const connectBtn2 = document.getElementById("connectBtn2");
const reconnectBtn = document.getElementById("reconnectBtn");
const claimBtn = document.getElementById("claimBtn");
const statusEl = document.getElementById("status");
const userAddressEl = document.getElementById("userAddress");
const pointsPill = document.getElementById("pointsPill");
const pointsDash = document.getElementById("pointsDash");
const claimStatus = document.getElementById("claimStatus");
const progressBar = document.getElementById("progressBar");
const liveCounter = document.getElementById("liveCounter");

let points = Number(localStorage.getItem("nebula_points") || "0");
updatePoints(points);

async function connectWallet() {
  if (!window.ethereum) {
    statusEl.textContent = "MetaMask не найден. Установите расширение.";
    return;
  }
  try {
    await window.ethereum.request({ method: "eth_requestAccounts" });
    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();
    userAddress = await signer.getAddress();
    statusEl.textContent = "Подключено: " + userAddress.slice(0,6) + "…" + userAddress.slice(-4);
    userAddressEl.textContent = userAddress;
    claimBtn.disabled = false;
    connectBtn.textContent = "Подключено";
    connectBtn.disabled = true;
  } catch(e) {
    console.error(e);
    statusEl.textContent = "Не удалось подключить кошелёк";
  }
}

if (connectBtn) connectBtn.addEventListener("click", connectWallet);
if (connectBtn2) connectBtn2.addEventListener("click", connectWallet);
if (reconnectBtn) reconnectBtn.addEventListener("click", connectWallet);

document.querySelectorAll("#tasksGrid input[type='checkbox']").forEach(cb => {
  cb.addEventListener("change", () => {
    const total = Array.from(document.querySelectorAll("#tasksGrid input[type='checkbox']:checked"))
      .reduce((acc, el) => acc + Number(el.dataset.points || 0), 0);
    points = total;
    updatePoints(points);
    localStorage.setItem("nebula_points", String(points));
  });
});

function updatePoints(val) {
  if (pointsPill) pointsPill.textContent = "Ваши баллы: " + val;
  if (pointsDash) pointsDash.textContent = val;
}

async function claim() {
  if (!signer || !userAddress) return;
  const payload = {
    type: "AIRDROP_CLAIM",
    project: PROJECT_NAME,
    token: TOKEN_SYMBOL,
    address: userAddress,
    points,
    ts: new Date().toISOString()
  };
  try {
    const signature = await signer.signMessage(JSON.stringify(payload));
    if (API_BASE) {
      await fetch(API_BASE + "/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, signature })
      });
    } else {
      const claims = JSON.parse(localStorage.getItem("nebula_claims") || "[]");
      claims.push({ ...payload, signature });
      localStorage.setItem("nebula_claims", JSON.stringify(claims));
    }
    claimStatus.querySelector("p").textContent = "Отправлена (демо)";
    claimStatus.classList.add("dash-card--green");
    claimBtn.disabled = true;
    statusEl.textContent = "Заявка отправлена ✔️ (демо)";
  } catch(e) {
    console.error(e);
    statusEl.textContent = "Подпись отклонена или ошибка";
  }
}
if (claimBtn) claimBtn.addEventListener("click", claim);

setInterval(() => {
  if (!liveCounter) return;
  const current = Number(liveCounter.textContent || "12480");
  liveCounter.textContent = current + Math.floor(Math.random()*3);
  if (progressBar) {
    const width = parseFloat(progressBar.style.width) || 43;
    const next = Math.min(width + Math.random()*0.05, 100);
    progressBar.style.width = next + "%";
  }
}, 3000);
