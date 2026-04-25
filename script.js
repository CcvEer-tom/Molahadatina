/* * ==========================================
 * Developed by Ibrahim Anouer
 * Platform: Molahadatna (Firebase Edition with Auth)
 * Version: 3.0.0 - مع المصادقة
 * ==========================================
 */

// استيراد مكتبات Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getDatabase, ref, push, onValue, remove, update } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-database.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";

// إعدادات الاتصال بقاعدة البيانات
const firebaseConfig = {
    apiKey: "AIzaSyBkh7Mp-ixAnlQbERW5f4FYDhFEDN8q2zk",
    authDomain: "molahadatma.firebaseapp.com",
    databaseURL: "https://molahadatma-default-rtdb.firebaseio.com",
    projectId: "molahadatma",
    storageBucket: "molahadatma.firebasestorage.app",
    messagingSenderId: "218152694932",
    appId: "1:218152694932:web:7b973873a194f72e8cb081",
    measurementId: "G-DHNGCLMPMF"
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);
const notesRef = ref(db, 'notes');

// متغيرات النظام الأساسية
let notes = [];
let currentUser = null;
let currentDisplayName = '';

// قائمة المواد الدراسية الأساسية
const defaultSubjects = [
    { id: 'math', name: 'رياضيات', icon: 'fas fa-calculator', color: '#667eea' },
    { id: 'science', name: 'علوم', icon: 'fas fa-flask', color: '#10b981' },
    { id: 'physics', name: 'فيزياء', icon: 'fas fa-atom', color: '#3b82f6' },
    { id: 'chemistry', name: 'كيمياء', icon: 'fas fa-vial', color: '#8b5cf6' },
    { id: 'biology', name: 'أحياء', icon: 'fas fa-dna', color: '#84cc16' },
    { id: 'arabic', name: 'لغة عربية', icon: 'fas fa-language', color: '#f59e0b' },
    { id: 'english', name: 'لغة إنجليزية', icon: 'fas fa-globe', color: '#ef4444' },
    { id: 'french', name: 'لغة فرنسية', icon: 'fas fa-flag', color: '#ec4899' },
    { id: 'history', name: 'تاريخ', icon: 'fas fa-landmark', color: '#f97316' },
    { id: 'geography', name: 'جغرافيا', icon: 'fas fa-globe-americas', color: '#06b6d4' },
    { id: 'islamic', name: 'تربية إسلامية', icon: 'fas fa-mosque', color: '#8b5cf6' },
    { id: 'art', name: 'تربية فنية', icon: 'fas fa-palette', color: '#ec4899' },
    { id: 'sport', name: 'تربية رياضية', icon: 'fas fa-running', color: '#84cc16' },
    { id: 'tech', name: 'تكنولوجيا', icon: 'fas fa-laptop-code', color: '#6366f1' },
    { id: 'economy', name: 'اقتصاد', icon: 'fas fa-chart-line', color: '#10b981' },
    { id: 'philosophy', name: 'فلسفة', icon: 'fas fa-brain', color: '#8b5cf6' },
    { id: 'psychology', name: 'علم نفس', icon: 'fas fa-user-friends', color: '#ec4899' },
    { id: 'sociology', name: 'اجتماعيات', icon: 'fas fa-users', color: '#f59e0b' },
    { id: 'civil', name: 'تربية مدنية', icon: 'fas fa-balance-scale', color: '#3b82f6' },
    { id: 'music', name: 'موسيقى', icon: 'fas fa-music', color: '#8b5cf6' }
];

let subjects = [];

// تحميل المواد المحفوظة من localStorage
function loadSubjects() {
    const saved = localStorage.getItem('subjects');
    if (saved) {
        subjects = JSON.parse(saved);
    } else {
        subjects = [...defaultSubjects];
    }
}

// حفظ المواد في localStorage
function saveSubjects() {
    localStorage.setItem('subjects', JSON.stringify(subjects));
}

// ==========================================
// وظائف المصادقة (Authentication)
// ==========================================

window.showLoginTab = function() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('loginTabBtn').style.color = '#4f46e5';
    document.getElementById('loginTabBtn').style.borderBottom = '3px solid #4f46e5';
    document.getElementById('registerTabBtn').style.color = '#64748b';
    document.getElementById('registerTabBtn').style.borderBottom = 'none';
    document.getElementById('loginBtn').style.display = 'block';
    document.getElementById('registerBtn').style.display = 'none';
};

window.showRegisterTab = function() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
    document.getElementById('registerTabBtn').style.color = '#4f46e5';
    document.getElementById('registerTabBtn').style.borderBottom = '3px solid #4f46e5';
    document.getElementById('loginTabBtn').style.color = '#64748b';
    document.getElementById('loginTabBtn').style.borderBottom = 'none';
    document.getElementById('loginBtn').style.display = 'none';
    document.getElementById('registerBtn').style.display = 'block';
};

// تسجيل الدخول
window.loginWithEmail = function() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showMessage("❌ الرجاء إدخال البريد الإلكتروني وكلمة المرور", "error");
        return;
    }
    
    showMessage("⏳ جاري تسجيل الدخول...", "success");
    
    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            currentDisplayName = user.displayName || user.email.split('@')[0];
            showMessage(`✅ مرحباً بك ${currentDisplayName}`, "success");
            document.getElementById('loginModal').style.display = 'none';
        })
        .catch((error) => {
            let msg = "";
            if (error.code === 'auth/invalid-credential') {
                msg = "البريد الإلكتروني أو كلمة المرور غير صحيحة";
            } else if (error.code === 'auth/user-not-found') {
                msg = "لا يوجد حساب بهذا البريد";
            } else if (error.code === 'auth/wrong-password') {
                msg = "كلمة المرور غير صحيحة";
            } else {
                msg = error.message;
            }
            showMessage("❌ " + msg, "error");
        });
};

// إنشاء حساب جديد
window.registerUser = function() {
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const displayName = document.getElementById('registerDisplayName').value.trim();
    
    if (!email || !password) {
        showMessage("❌ الرجاء إدخال البريد الإلكتروني وكلمة المرور", "error");
        return;
    }
    
    if (password.length < 6) {
        showMessage("❌ كلمة المرور يجب أن تكون 6 أحرف على الأقل", "error");
        return;
    }
    
    showMessage("⏳ جاري إنشاء الحساب...", "success");
    
    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            const nameToSave = displayName || user.email.split('@')[0];
            
            // تحديث الاسم المعروض
            updateProfile(user, { displayName: nameToSave }).then(() => {
                currentDisplayName = nameToSave;
                showMessage(`✅ تم إنشاء الحساب بنجاح! مرحباً ${nameToSave}`, "success");
                document.getElementById('loginModal').style.display = 'none';
            });
        })
        .catch((error) => {
            let msg = "";
            if (error.code === 'auth/email-already-in-use') {
                msg = "هذا البريد الإلكتروني مسجل بالفعل";
            } else if (error.code === 'auth/weak-password') {
                msg = "كلمة المرور ضعيفة جداً";
            } else if (error.code === 'auth/invalid-email') {
                msg = "البريد الإلكتروني غير صحيح";
            } else {
                msg = error.message;
            }
            showMessage("❌ " + msg, "error");
        });
};

// تسجيل الخروج
window.logout = function() {
    if (confirm("هل تريد تسجيل الخروج؟")) {
        signOut(auth).then(() => {
            showMessage("👋 تم تسجيل الخروج", "success");
        });
    }
};

// مراقبة حالة تسجيل الدخول
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        currentDisplayName = user.displayName || user.email.split('@')[0];
        localStorage.setItem('currentUser', currentDisplayName);
        updateNavUser();
        
        // تحميل البيانات بعد تسجيل الدخول
        loadSubjects();
        updateSubjectSelect();
        displaySubjectButtons();
        displaySubjects();
        setupEventListeners();
        
        // الاستماع لقاعدة البيانات
        onValue(notesRef, (snapshot) => {
            const data = snapshot.val();
            notes = [];
            if (data) {
                Object.keys(data).forEach(key => {
                    notes.push({ id: key, ...data[key] });
                });
                notes.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            }
            displayNotes();
            displaySubjects();
        });
    } else {
        currentUser = null;
        updateNavUser();
        showLoginModal();
    }
});

// ==========================================
// وظائف التطبيق الأساسية
// ==========================================

window.showLoginModal = function() {
    const modal = document.getElementById('loginModal');
    if (modal) modal.style.display = 'flex';
};

window.addNewSubject = function() {
    if (!currentUser) { showLoginModal(); return; }
    
    const newName = prompt("📚 أدخل اسم المادة الجديدة:");
    if (newName && newName.trim()) {
        const check = subjects.find(s => s.name === newName.trim());
        if (check) {
            showMessage("⚠️ المادة موجودة أصلاً", "error");
            return;
        }
        const newSub = {
            id: 'custom_' + Date.now(),
            name: newName.trim(),
            icon: 'fas fa-book-open',
            color: '#' + Math.floor(Math.random()*16777215).toString(16)
        };
        subjects.push(newSub);
        saveSubjects();
        updateSubjectSelect();
        displaySubjectButtons();
        displaySubjects();
        showMessage(`✅ تمت إضافة مادة "${newName}" بنجاح`, "success");
    }
};

window.addNote = function() {
    if (!currentUser) { showLoginModal(); return; }
    
    const titleObj = document.getElementById('noteTitle');
    const subjectObj = document.getElementById('noteSubject');
    const contentObj = document.getElementById('noteContent');

    const title = titleObj.value.trim();
    const subject = subjectObj.value;
    const content = contentObj.value.trim();

    if (!title || !subject || !content) {
        showMessage("❌ الرجاء ملء جميع الحقول!", "error");
        return;
    }

    const subData = subjects.find(s => s.name === subject) || { icon: 'fas fa-file', color: '#ccc' };

    const newNote = {
        title: title,
        subject: subject,
        content: content,
        author: currentDisplayName,
        authorEmail: currentUser.email,
        subjectIcon: subData.icon,
        subjectColor: subData.color,
        date: new Date().toLocaleDateString('ar-MA'),
        time: new Date().toLocaleTimeString('ar-MA', { hour: '2-digit', minute: '2-digit' }),
        likes: 0,
        timestamp: Date.now()
    };

    push(notesRef, newNote).then(() => {
        titleObj.value = '';
        contentObj.value = '';
        showMessage("✅ تم نشر الملاحظة بنجاح!", "success");
    }).catch(error => {
        showMessage("❌ حدث خطأ في النشر", "error");
        console.error(error);
    });
};

window.displayNotes = function() {
    const list = document.getElementById('notesList');
    if (!list) return;
    
    const search = document.getElementById('searchNotes')?.value.toLowerCase() || '';
    const filter = document.getElementById('filterSubject')?.value || '';
    const sort = document.getElementById('sortBy')?.value || 'newest';

    let filtered = notes.filter(n => {
        const matchesSearch = n.title.toLowerCase().includes(search) || n.content.toLowerCase().includes(search);
        const matchesFilter = !filter || n.subject === filter;
        return matchesSearch && matchesFilter;
    });

    if (sort === 'oldest') filtered.sort((a,b) => a.timestamp - b.timestamp);
    if (sort === 'mostLikes') filtered.sort((a,b) => (b.likes || 0) - (a.likes || 0));
    if (sort === 'newest') filtered.sort((a,b) => b.timestamp - a.timestamp);

    if (filtered.length === 0) {
        list.innerHTML = `<div class="empty-state">
            <i class="fas fa-inbox"></i>
            <p>لا توجد ملاحظات لعرضها</p>
        </div>`;
        return;
    }

    list.innerHTML = filtered.map(n => `
        <div class="note-card" style="border-right: 6px solid ${n.subjectColor || '#ccc'}">
            <div class="note-header">
                <h3>${escapeHtml(n.title)}</h3>
                <span class="badge" style="background:${n.subjectColor || '#ccc'}22; color:${n.subjectColor || '#ccc'}">
                    <i class="${n.subjectIcon || 'fas fa-book'}"></i> ${escapeHtml(n.subject)}
                </span>
            </div>
            <div class="note-meta">👤 بواسطة: <b>${escapeHtml(n.author)}</b> | 📅 ${n.date || ''}</div>
            <p class="note-text">${escapeHtml(n.content).replace(/\n/g, '<br>')}</p>
            <div class="note-footer">
                <button onclick="window.likeNote('${n.id}')" class="btn-like">❤️ ${n.likes || 0}</button>
                ${n.authorEmail === currentUser?.email ? `<button onclick="window.deleteNote('${n.id}')" class="btn-del">🗑️ حذف</button>` : ''}
            </div>
        </div>
    `).join('');
};

window.likeNote = function(id) {
    if (!currentUser) { showLoginModal(); return; }
    
    const note = notes.find(n => n.id === id);
    if (note) {
        update(ref(db, `notes/${id}`), { likes: (note.likes || 0) + 1 });
        showMessage("👍 شكراً لك!", "success");
    }
};

window.deleteNote = function(id) {
    if (!currentUser) { showLoginModal(); return; }
    
    if (confirm("🗑️ هل أنت متأكد من حذف هذه الملاحظة؟")) {
        remove(ref(db, `notes/${id}`)).then(() => {
            showMessage("✅ تم حذف الملاحظة", "success");
        });
    }
};

window.resetFilters = function() {
    const searchInput = document.getElementById('searchNotes');
    const filterSelect = document.getElementById('filterSubject');
    const sortSelect = document.getElementById('sortBy');
    
    if (searchInput) searchInput.value = '';
    if (filterSelect) filterSelect.value = '';
    if (sortSelect) sortSelect.value = 'newest';
    
    displayNotes();
    showMessage("📋 تم عرض جميع الملاحظات", "success");
};

window.clearForm = function() {
    document.getElementById('noteTitle').value = '';
    document.getElementById('noteContent').value = '';
    document.getElementById('noteSubject').value = '';
    
    document.querySelectorAll('.subject-option').forEach(el => {
        el.classList.remove('active');
    });
    
    showMessage("🧹 تم مسح النموذج", "success");
};

function updateSubjectSelect() {
    const noteSubjectSelect = document.getElementById('noteSubject');
    const filterSubjectSelect = document.getElementById('filterSubject');
    
    const options = subjects.map(s => `<option value="${escapeHtml(s.name)}">${escapeHtml(s.name)}</option>`).join('');
    
    if (noteSubjectSelect) {
        noteSubjectSelect.innerHTML = '<option value="">-- اختر المادة --</option>' + options;
    }
    if (filterSubjectSelect) {
        filterSubjectSelect.innerHTML = '<option value="">كل المواد</option>' + options;
    }
}

function displaySubjectButtons() {
    const container = document.getElementById('subjectOptions');
    if (!container) return;
    
    container.innerHTML = subjects.map(s => `
        <div class="subject-option" onclick="window.selectSubject('${escapeHtml(s.name).replace(/'/g, "\\'")}')" style="border-color:${s.color}">
            <i class="${s.icon}" style="color:${s.color}"></i>
            <span>${escapeHtml(s.name)}</span>
        </div>
    `).join('');
}

window.selectSubject = function(name) {
    const select = document.getElementById('noteSubject');
    if (select) {
        select.value = name;
    }
    document.querySelectorAll('.subject-option').forEach(el => {
        el.classList.toggle('active', el.innerText.trim() === name);
    });
};

function displaySubjects() {
    const container = document.getElementById('subjectsContainer');
    if (!container) return;
    
    const counts = {};
    notes.forEach(n => {
        counts[n.subject] = (counts[n.subject] || 0) + 1;
    });

    container.innerHTML = subjects.map(s => `
        <div class="subject-card" onclick="window.filterBySubject('${escapeHtml(s.name).replace(/'/g, "\\'")}')" style="--clr:${s.color}">
            <i class="${s.icon}"></i>
            <h4>${escapeHtml(s.name)}</h4>
            <span class="note-count">📝 ${counts[s.name] || 0} ملاحظة</span>
        </div>
    `).join('');
}

window.filterBySubject = function(name) {
    const filterEl = document.getElementById('filterSubject');
    if (filterEl) {
        filterEl.value = name;
        displayNotes();
        showMessage(`🔍 عرض ملاحظات مادة: ${name}`, "success");
        document.querySelector('.notes-section')?.scrollIntoView({ behavior: 'smooth' });
    }
};

function updateNavUser() {
    const nav = document.getElementById('navUser');
    if (nav) {
        if (currentUser) {
            nav.innerHTML = `
                <div class="user-pill">
                    <span>👤 ${escapeHtml(currentDisplayName)}</span>
                    <span style="font-size: 0.7rem; opacity: 0.8;">📧 ${escapeHtml(currentUser.email)}</span>
                    <button onclick="window.logout()">🚪 خروج</button>
                </div>
            `;
        } else {
            nav.innerHTML = `<button onclick="window.showLoginModal()" class="btn-secondary" style="background:white; color:#4f46e5;">🔐 تسجيل الدخول</button>`;
        }
    }
}

function showMessage(msg, type) {
    const box = document.getElementById('messageContainer');
    if (!box) return;
    
    const m = document.createElement('div');
    m.className = `toast ${type}`;
    m.innerHTML = msg;
    box.appendChild(m);
    setTimeout(() => m.remove(), 3000);
}

function setupEventListeners() {
    const searchInput = document.getElementById('searchNotes');
    const filterSelect = document.getElementById('filterSubject');
    const sortSelect = document.getElementById('sortBy');
    
    if (searchInput) searchInput.addEventListener('input', () => displayNotes());
    if (filterSelect) filterSelect.addEventListener('change', () => displayNotes());
    if (sortSelect) sortSelect.addEventListener('change', () => displayNotes());
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// انطلاق التطبيق
document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 نظام الملاحظات يعمل مع المصادقة...");
    showLoginModal();
});
