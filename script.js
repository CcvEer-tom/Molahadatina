import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getDatabase, ref, push, onValue, remove, update } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyBkh7Mp-ixAnlQbERW5f4FYDhFEDN8q2zk",
    authDomain: "molahadatma.firebaseapp.com",
    databaseURL: "https://molahadatma-default-rtdb.firebaseio.com",
    projectId: "molahadatma",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const notesRef = ref(db, 'notes');

let notes = [];
let currentUser = "";

// ============================================
// المواد الدراسية (حسب طلبك)
// ============================================
const subjects = [
    { name: "التربية البدنية", icon: "fa-futbol", color: "#10b981" },
    { name: "علوم الحياة والأرض", icon: "fa-leaf", color: "#84cc16" },
    { name: "الفيزياء والكيمياء", icon: "fa-atom", color: "#3b82f6" },
    { name: "الرياضيات", icon: "fa-calculator", color: "#667eea" },
    { name: "المعلوميات", icon: "fa-laptop-code", color: "#6366f1" },
    { name: "الفرنسية", icon: "fa-flag", color: "#ec4899" },
    { name: "العربية", icon: "fa-language", color: "#f59e0b" },
    { name: "الفلسفة", icon: "fa-brain", color: "#8b5cf6" },
    { name: "الاجتماعيات", icon: "fa-users", color: "#f97316" },
    { name: "الإنجليزية", icon: "fa-globe", color: "#ef4444" },
    { name: "التربية الإسلامية", icon: "fa-mosque", color: "#10b981" }
];

// بدء التشغيل
document.addEventListener("DOMContentLoaded", () => {
    currentUser = localStorage.getItem("currentUser") || "";
    updateSelects();
    showSubjects();
    
    if (!currentUser) {
        document.getElementById("loginModal").style.display = "flex";
    } else {
        document.getElementById("navUser").innerHTML = `<div class="user-pill">👤 ${currentUser} <button onclick="logout()">خروج</button></div>`;
    }
    
    onValue(notesRef, (snapshot) => {
        notes = [];
        const data = snapshot.val();
        if (data) {
            Object.keys(data).forEach(key => notes.push({ id: key, ...data[key] }));
        }
        showNotes();
        showSubjects();
    });
});

window.saveUsername = function() {
    const name = document.getElementById("usernameInput").value.trim();
    if (name.length < 2) {
        alert("الاسم قصير جداً");
        return;
    }
    currentUser = name;
    localStorage.setItem("currentUser", name);
    document.getElementById("loginModal").style.display = "none";
    document.getElementById("navUser").innerHTML = `<div class="user-pill">👤 ${name} <button onclick="logout()">خروج</button></div>`;
};

window.logout = function() {
    localStorage.removeItem("currentUser");
    location.reload();
};

function updateSelects() {
    let options = '<option value="">-- اختر المادة --</option>';
    subjects.forEach(s => options += `<option value="${s.name}">${s.name}</option>`);
    document.getElementById("noteSubject").innerHTML = options;
    document.getElementById("filterSubject").innerHTML = '<option value="">كل المواد</option>' + options;
}

function showSubjects() {
    const counts = {};
    notes.forEach(n => counts[n.subject] = (counts[n.subject] || 0) + 1);
    
    document.getElementById("subjectsContainer").innerHTML = subjects.map(s => `
        <div class="subject-card" onclick="filterBySubject('${s.name}')" style="--clr:${s.color}">
            <i class="fas ${s.icon}"></i>
            <h4>${s.name}</h4>
            <span>${counts[s.name] || 0}</span>
        </div>
    `).join('');
}

window.addNewSubject = function() {
    const newName = prompt("📚 أدخل اسم المادة الجديدة:");
    if (newName && !subjects.find(s => s.name === newName)) {
        subjects.push({ 
            name: newName, 
            icon: "fa-book", 
            color: "#" + Math.floor(Math.random()*16777215).toString(16) 
        });
        updateSelects();
        showSubjects();
        showMessage(`✅ تمت إضافة مادة: ${newName}`, "success");
    } else if (newName) {
        showMessage("⚠️ المادة موجودة بالفعل", "error");
    }
};

window.addNote = function() {
    if (!currentUser) {
        document.getElementById("loginModal").style.display = "flex";
        return;
    }
    
    const title = document.getElementById("noteTitle").value.trim();
    const subject = document.getElementById("noteSubject").value;
    const content = document.getElementById("noteContent").value.trim();
    
    if (!title || !subject || !content) {
        showMessage("❌ الرجاء ملء جميع الحقول", "error");
        return;
    }
    
    const sub = subjects.find(s => s.name === subject);
    push(notesRef, {
        title, subject, content,
        author: currentUser,
        icon: sub?.icon || "fa-book",
        color: sub?.color || "#6b7280",
        date: new Date().toLocaleDateString("ar-MA"),
        timestamp: Date.now(),
        likes: 0
    });
    
    document.getElementById("noteTitle").value = "";
    document.getElementById("noteContent").value = "";
    showMessage("✅ تم نشر الملاحظة بنجاح!", "success");
};

window.showNotes = function() {
    const search = document.getElementById("searchNotes")?.value.toLowerCase() || "";
    const filter = document.getElementById("filterSubject")?.value || "";
    const sort = document.getElementById("sortBy")?.value || "newest";
    
    let filtered = notes.filter(n => 
        (n.title?.toLowerCase().includes(search) || n.content?.toLowerCase().includes(search)) &&
        (!filter || n.subject === filter)
    );
    
    if (sort === "oldest") filtered.sort((a,b) => a.timestamp - b.timestamp);
    if (sort === "mostLikes") filtered.sort((a,b) => b.likes - a.likes);
    
    if (filtered.length === 0) {
        document.getElementById("notesList").innerHTML = '<div class="empty-state">📭 لا توجد ملاحظات</div>';
        return;
    }
    
    document.getElementById("notesList").innerHTML = filtered.map(n => `
        <div class="note-card">
            <div class="note-header">
                <h3>${escapeHtml(n.title)}</h3>
                <span class="badge" style="background:${n.color}22; color:${n.color}">
                    <i class="fas ${n.icon}"></i> ${escapeHtml(n.subject)}
                </span>
            </div>
            <div class="note-meta">👤 ${escapeHtml(n.author)} | 📅 ${n.date}</div>
            <p class="note-text">${escapeHtml(n.content).replace(/\n/g, "<br>")}</p>
            <div class="note-footer">
                <button onclick="likeNote('${n.id}')" class="btn-like">❤️ ${n.likes || 0}</button>
                ${n.author === currentUser ? `<button onclick="deleteNote('${n.id}')" class="btn-del">🗑️ حذف</button>` : ''}
            </div>
        </div>
    `).join('');
};

function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

window.likeNote = (id) => update(ref(db, `notes/${id}`), { likes: (notes.find(n => n.id === id)?.likes || 0) + 1 });
window.deleteNote = (id) => { if(confirm("🗑️ هل تريد حذف هذه الملاحظة؟")) remove(ref(db, `notes/${id}`)); };
window.filterBySubject = (name) => { document.getElementById("filterSubject").value = name; showNotes(); };
window.resetFilters = () => { document.getElementById("searchNotes").value = ""; document.getElementById("filterSubject").value = ""; showNotes(); };
window.clearForm = () => { document.getElementById("noteTitle").value = ""; document.getElementById("noteContent").value = ""; };

function showMessage(msg, type) {
    const box = document.getElementById("messageContainer");
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerText = msg;
    box.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

document.getElementById("searchNotes")?.addEventListener("input", showNotes);
document.getElementById("filterSubject")?.addEventListener("change", showNotes);
document.getElementById("sortBy")?.addEventListener("change", showNotes);
