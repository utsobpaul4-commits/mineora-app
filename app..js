// ========================================================
// ১. SUPABASE কানেকশন (এখানে আপনার সঠিক প্রজেক্ট ক্রেডেনশিয়াল বসাবেন)
// ========================================================
const AM_SUPABASE_URL = "https://jbpkurvrleupiedafmox.supabase.co"; 
const AM_SUPABASE_KEY = "sb_publishable_8iPNBiyICc4WvDX-CxtbcQ_0fEyWQ7R";             
const baseClient = typeof supabase !== 'undefined' ? supabase.createClient(AM_SUPABASE_URL, AM_SUPABASE_KEY) : null;

// ========================================================
// ২. ২৪/৭ রিয়েল-টাইম সেশন ট্র্যাকিং (টেলিগ্রাম ডাইনামিক ডেটা সিমুলেশন)
// ========================================================
let currentTelegramID = "308966743"; // ইউজার ভেরিফিকেশন আইডি
let userData = { mno_balance: 0, last_mining_start: null, referral_code: "MNO" + currentTelegramID };
let miningInterval = null;

// ========================================================
// ⛏️ ৩. ব্যাকএন্ড-সুরক্ষিত ২৪/৭ মাইনিং ইঞ্জিন
// ========================================================
async function initializeUserPanel() {
    if (!baseClient) return console.error("Database connection missing!");
    
    // ডাটাবেজ থেকে ইউজারের লেটেস্ট ব্যালেন্স ও মাইনিং স্ট্যাম্প চেক করা
    let { data: user, error } = await baseClient.from('users').select('*').eq('telegram_id', currentTelegramID).single();
    
    if (!user && !error) {
        // নতুন ইউজার হলে ডাটাবেজে স্থায়ী অ্যাকাউন্ট তৈরি করা
        const { data: newUser } = await baseClient.from('users').insert([
            { telegram_id: currentTelegramID, mno_balance: 0, referral_code: userData.referral_code }
        ]).select().single();
        user = newUser;
    }

    if (user) {
        userData = user;
        document.getElementById("userMnoBalance").innerText = userData.mno_balance.toFixed(2) + " MNO";
        document.getElementById("userRefCode").innerText = userData.referral_code;
        
        // ২৪/৭ ক্যালকুলেশন ইঞ্জিন রান করা (ইউজার অফলাইনে থাকলেও টাইমস্ট্যাম্পের মাধ্যমে সঠিক হিসাব আসবে)
        calculateOfflineMining(userData.last_mining_start);
    }
}

function calculateOfflineMining(lastStartTimestamp) {
    if (!lastStartTimestamp) return;

    const startTime = new Date(lastStartTimestamp).getTime();
    const now = new Date().getTime();
    const totalDuration = 24 * 60 * 60 * 1000; // ২৪ ঘণ্টা মিলিগ্রাম
    const elapsedTime = now - startTime;

    if (elapsedTime >= totalDuration) {
        // ২৪ ঘণ্টা শেষ হলে মাইনিং স্টপ হয়ে রিওয়ার্ড ক্লেইমের জন্য রেডি থাকবে
        document.getElementById("miningBar").style.width = "100%";
        document.getElementById("timerText").innerText = "00:00:00";
        const btn = document.getElementById("miningActionBtn");
        btn.innerText = "Claim Mining Reward (120 MNO)";
        btn.onclick = claimMiningReward;
    } else {
        // মাইনিং চলমান থাকলে যেখান থেকে বন্ধ হয়েছিল সেখান থেকে রানিং থাকবে
        startLiveTimer(totalDuration - elapsedTime, elapsedTime, totalDuration);
    }
}

function startLiveTimer(remainingTime, elapsed, total) {
    const btn = document.getElementById("miningActionBtn");
    btn.innerText = "Mining Active...";
    btn.classList.add("claimed");
    btn.onclick = null;

    if (miningInterval) clearInterval(miningInterval);

    miningInterval = setInterval(() => {
        remainingTime -= 1000;
        elapsed += 1000;
        
        let pct = (elapsed / total) * 100;
        document.getElementById("miningBar").style.width = `${pct}%`;

        if (remainingTime <= 0) {
            clearInterval(miningInterval);
            initializeUserPanel();
        } else {
            let hours = Math.floor(remainingTime / (1000 * 60 * 60));
            let minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
            let seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);
            document.getElementById("timerText").innerText = 
                `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }
    }, 1000);
}

async function triggerMining() {
    const nowIso = new Date().toISOString();
    
    // ডাটাবেজে স্থায়ীভাবে মাইনিং শুরুর সময় লক করা (যাতে পেজ কাটলেও বন্ধ না হয়)
    const { error } = await baseClient.from('users')
        .update({ last_mining_start: nowIso })
        .eq('telegram_id', currentTelegramID);

    if (!error) {
        initializeUserPanel();
    } else {
        alert("Mining activation failed. Try again.");
    }
}

async function claimMiningReward() {
    const reward = 120; // ৫ MNO * ২৪ ঘণ্টা
    const newBalance = userData.mno_balance + reward;

    // ক্লাউড ডেটাবেজে ফাইনাল ব্যালেন্স সেভ করা
    const { error } = await baseClient.from('users')
        .update({ mno_balance: newBalance, last_mining_start: null })
        .eq('telegram_id', currentTelegramID);

    if (!error) {
        alert(`🎉 Successfully claimed ${reward} MNO!`);
        window.location.reload();
    }
}

// ========================================================
// 📱 ৪. ইউজার প্যানেল ট্যাব কন্ট্রোলার
// ========================================================
function changeTab(tabName) {
    const elements = document.querySelectorAll('.page-tab');
    elements.forEach(el => el.classList.remove('active'));
    document.getElementById(tabName + 'Tab').classList.add('active');
    
    const navButtons = document.querySelectorAll('.navigation-bar button');
    navButtons.forEach(btn => btn.classList.remove('active'));
    event.currentTarget.classList.add('active');
        }
