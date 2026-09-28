// ==========================================
// ১. Supabase কানেকশন কনফিগারেশন
// ==========================================
const AM_SUPABASE_URL = "https://supabase.co"; // আপনার Supabase URL এখানে দিন
const AM_SUPABASE_KEY = "your-anon-public-key";             // আপনার Supabase Anon Key এখানে দিন
const baseClient = typeof supabase !== 'undefined' ? supabase.createClient(AM_SUPABASE_URL, AM_SUPABASE_KEY) : null;

// ==========================================
// ২. কঠোর এডমিন আইডেন্টিটি রুলস (Hardcoded)
// ==========================================
const TARGET_ADMIN_ID = "308966743";   // টেলিগ্রাম @Utsob_P এর নির্দিষ্ট ID
const TARGET_ADMIN_PASS = "Utsob@743"; // এডমিন সিক্রেট পাসওয়ার্ড

// ==========================================
// 🔐 ৩. এডমিন লগইন ও সেশন প্রটেকশন লজিক
// ==========================================
function executeAdminAuth() {
    const enteredUser = document.getElementById("inputAdminUser").value.trim();
    const enteredPass = document.getElementById("inputAdminPass").value.trim();

    // শুধুমাত্র আইডি এবং পাসওয়ার্ড মিললেই সেশন তৈরি হবে
    if (enteredUser === TARGET_ADMIN_ID && enteredPass === TARGET_ADMIN_PASS) {
        sessionStorage.setItem("secure_admin_session", "active_auth_" + TARGET_ADMIN_ID);
        
        document.getElementById("loginAuthGateway").style.display = "none";
        document.getElementById("mainAdminConsole").style.display = "block";
        
        syncAdminDashboardData();
    } else {
        alert("🚨 Access Denied! Invalid credentials or unauthorized account.");
    }
}

function verifyActiveAdminSession() {
    const token = sessionStorage.getItem("secure_admin_session");
    
    if (token === "active_auth_" + TARGET_ADMIN_ID) {
        document.getElementById("loginAuthGateway").style.display = "none";
        document.getElementById("mainAdminConsole").style.display = "block";
        syncAdminDashboardData();
    } else {
        document.getElementById("loginAuthGateway").style.display = "block";
        document.getElementById("mainAdminConsole").style.display = "none";
    }
}

function performAdminLogout() {
    sessionStorage.removeItem("secure_admin_session");
    window.location.reload();
}

// ==========================================
// 🎯 ৪. এডমিন ডাটাবেজ অপারেশনস (Tasks & Stats)
// ==========================================
async function submitNewTaskToDb() {
    const title = document.getElementById("admTaskTitle").value.trim();
    const description = document.getElementById("admTaskDesc").value.trim();
    const type = document.getElementById("admTaskType").value;
    const link = document.getElementById("admTaskLink").value.trim();
    const reward = parseFloat(document.getElementById("admTaskReward").value);

    if (!title || !link || !reward) return alert("Please fill out all required fields.");
    if (!baseClient) return alert("Database not connected.");

    const { data, error } = await baseClient.from('tasks').insert([
        { title, description, type, link, reward, is_active: true }
    ]);

    if (error) {
        alert("Database Error: " + error.message);
    } else {
        alert("🎯 Task deployed successfully!");
        window.location.reload();
    }
}

async function syncAdminDashboardData() {
    if (!baseClient) return;
    
    // মোট ইউজার কাউন্ট
    const { count: totalUsers } = await baseClient.from('users').select('*', { count: 'exact', head: true });
    document.getElementById("totalUsersCount").innerText = totalUsers || 0;

    // পেন্ডিং উইথড্র কাউন্ট
    const { data: withdrawals } = await baseClient.from('withdrawals').select('*').eq('status', 'Pending');
    document.getElementById("pendingWithdrawCount").innerText = withdrawals ? withdrawals.length : 0;
}

// ==========================================
// 📱 ৫. ইউজার প্যানেল কন্ট্রোল (Tab Switching)
// ==========================================
function changeTab(tabName) {
    const elements = document.querySelectorAll('.page-tab');
    elements.forEach(el => el.classList.remove('active'));
    document.getElementById(tabName + 'Tab').classList.add('active');
}

function initializeUserPanel() {
    console.log("Mineora User Interface Initialized.");
    // এখানে ইউজারদের ব্যালেন্স এবং ডাটাবেজ থেকে লাইভ টাস্ক রেন্ডার করার কোড বসবে
}