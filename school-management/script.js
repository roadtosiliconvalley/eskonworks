const DB_KEY = 'eskonworks-school-db-v1';
const $ = (id) => document.getElementById(id);

function uid(prefix) {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
}

function seedData() {
  const now = new Date().toISOString();
  const teachers = [
    { id: 't1', name: 'Ms. Rivera', subject: 'Math', email: 'rivera@example.com', phone: '555-0101' },
    { id: 't2', name: 'Mr. Chen', subject: 'Science', email: 'chen@example.com', phone: '555-0102' },
    { id: 't3', name: 'Ms. Okafor', subject: 'English', email: 'okafor@example.com', phone: '555-0103' },
    { id: 't4', name: 'Mr. Brooks', subject: 'History', email: 'brooks@example.com', phone: '555-0104' }
  ];
  const classes = [
    { id: 'c1', name: '10-A', grade: 'Grade 10', room: '201', teacherId: 't1' },
    { id: 'c2', name: '10-B', grade: 'Grade 10', room: '202', teacherId: 't2' },
    { id: 'c3', name: '11-A', grade: 'Grade 11', room: '301', teacherId: 't3' }
  ];
  const students = [
    { id: 's1', name: 'Ava Patel', email: 'ava@example.com', classId: 'c1', phone: '555-0201' },
    { id: 's2', name: 'Noah Kim', email: 'noah@example.com', classId: 'c1', phone: '555-0202' },
    { id: 's3', name: 'Mia Torres', email: 'mia@example.com', classId: 'c1', phone: '555-0203' },
    { id: 's4', name: 'Liam Chen', email: 'liam@example.com', classId: 'c2', phone: '555-0204' },
    { id: 's5', name: 'Zoe Johnson', email: 'zoe@example.com', classId: 'c2', phone: '555-0205' },
    { id: 's6', name: 'Ethan Brown', email: 'ethan@example.com', classId: 'c2', phone: '555-0206' },
    { id: 's7', name: 'Isla Davis', email: 'isla@example.com', classId: 'c3', phone: '555-0207' },
    { id: 's8', name: 'Leo Wilson', email: 'leo@example.com', classId: 'c3', phone: '555-0208' }
  ];
  const grades = [
    { id: 'g1', studentId: 's1', subject: 'Math', score: 94, date: now },
    { id: 'g2', studentId: 's1', subject: 'Science', score: 88, date: now },
    { id: 'g3', studentId: 's2', subject: 'Math', score: 76, date: now },
    { id: 'g4', studentId: 's3', subject: 'English', score: 91, date: now },
    { id: 'g5', studentId: 's4', subject: 'Science', score: 83, date: now },
    { id: 'g6', studentId: 's7', subject: 'History', score: 68, date: now }
  ];
  const attendance = {
    [`${todayISO()}|c1`]: { s1: 'present', s2: 'present', s3: 'absent' },
    [`${todayISO()}|c2`]: { s4: 'present', s5: 'present' }
  };
  return {
    students, teachers, classes, grades, attendance,
    activity: [{ text: 'Demo data loaded', date: now }]
  };
}

let db;
try { db = JSON.parse(localStorage.getItem(DB_KEY)); } catch { db = null; }
if (!db || !Array.isArray(db.students)) {
  db = seedData();
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function save() {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function logActivity(text) {
  db.activity.unshift({ text, date: new Date().toISOString() });
  db.activity = db.activity.slice(0, 12);
}

function className(id) {
  return db.classes.find((item) => item.id === id)?.name || 'Unassigned';
}

function studentName(id) {
  return db.students.find((item) => item.id === id)?.name || 'Unknown student';
}

function teacherName(id) {
  return db.teachers.find((item) => item.id === id)?.name || 'Unassigned';
}

function gradeInfo(score) {
  if (score >= 90) return { label: 'A', cls: 'good' };
  if (score >= 75) return { label: 'B', cls: 'good' };
  if (score >= 60) return { label: 'C', cls: 'ok' };
  return { label: 'F', cls: 'low' };
}

function options(items, selected, label) {
  return items.map((item) => `<option value="${esc(item.id)}"${item.id === selected ? ' selected' : ''}>${esc(label(item))}</option>`).join('');
}

function populateSelects() {
  const studentClass = $('student-class').value;
  const attendanceClass = $('attendance-class').value;
  const gradeStudent = $('grade-student').value;
  const classTeacher = $('class-teacher').value;

  $('student-class').innerHTML = options(db.classes, studentClass, (item) => item.name);
  $('class-teacher').innerHTML = options(db.teachers, classTeacher, (item) => item.name);
  $('attendance-class').innerHTML = options(db.classes, attendanceClass || db.classes[0]?.id, (item) => item.name);
  $('grade-student').innerHTML = options(db.students, gradeStudent, (item) => item.name);

  const subjects = [...new Set(db.teachers.map((teacher) => teacher.subject).concat(db.grades.map((grade) => grade.subject)))].filter(Boolean);
  $('subject-list').innerHTML = subjects.map((subject) => `<option value="${esc(subject)}"></option>`).join('');
}

function renderDashboard() {
  $('stat-students').textContent = db.students.length;
  $('stat-teachers').textContent = db.teachers.length;
  $('stat-classes').textContent = db.classes.length;

  const attendanceValues = Object.values(db.attendance).flatMap((day) => Object.values(day));
  const present = attendanceValues.filter((status) => status === 'present').length;
  $('stat-attendance').textContent = attendanceValues.length ? `${Math.round((present / attendanceValues.length) * 100)}%` : '—';

  const average = db.grades.length
    ? Math.round(db.grades.reduce((sum, grade) => sum + Number(grade.score), 0) / db.grades.length)
    : null;
  $('stat-average').textContent = average === null ? '—' : `${average}%`;

  const counts = db.classes.map((item) => ({
    name: item.name,
    count: db.students.filter((student) => student.classId === item.id).length
  }));
  const max = Math.max(1, ...counts.map((item) => item.count));
  $('class-bars').innerHTML = counts.length
    ? counts.map((item) => `
      <div class="bar-row">
        <span>${esc(item.name)}</span>
        <div class="bar-track"><div class="bar-fill" style="width:${(item.count / max) * 100}%"></div></div>
        <span>${item.count}</span>
      </div>`).join('')
    : '<p class="empty">No classes yet.</p>';

  $('activity-list').innerHTML = db.activity.length
    ? db.activity.map((item) => {
      const date = new Date(item.date);
      const stamp = Number.isNaN(date.getTime()) ? '' : date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      return `<div class="activity-item"><time>${esc(stamp)}</time><span>${esc(item.text)}</span></div>`;
    }).join('')
    : '<p class="empty">No activity yet.</p>';
}

function renderStudents() {
  const query = $('student-search').value.trim().toLowerCase();
  const list = db.students.filter((student) => `${student.name} ${student.email} ${className(student.classId)}`.toLowerCase().includes(query));
  $('student-rows').innerHTML = list.length
    ? list.map((student) => `
      <tr>
        <td><strong>${esc(student.name)}</strong><span class="sub">${esc(student.phone || 'No phone')}</span></td>
        <td><span class="badge">${esc(className(student.classId))}</span></td>
        <td>${esc(student.email)}</td>
        <td><div class="row-actions">
          <button type="button" class="row-btn" data-edit-student="${esc(student.id)}">Edit</button>
          <button type="button" class="row-btn delete" data-delete-student="${esc(student.id)}">Delete</button>
        </div></td>
      </tr>`).join('')
    : '<tr><td colspan="4" class="empty">No students found.</td></tr>';
}

function renderTeachers() {
  $('teacher-rows').innerHTML = db.teachers.length
    ? db.teachers.map((teacher) => `
      <tr>
        <td><strong>${esc(teacher.name)}</strong><span class="sub">${esc(teacher.phone || 'No phone')}</span></td>
        <td>${esc(teacher.subject)}</td>
        <td>${esc(teacher.email)}</td>
        <td><div class="row-actions">
          <button type="button" class="row-btn" data-edit-teacher="${esc(teacher.id)}">Edit</button>
          <button type="button" class="row-btn delete" data-delete-teacher="${esc(teacher.id)}">Delete</button>
        </div></td>
      </tr>`).join('')
    : '<tr><td colspan="4" class="empty">No teachers yet.</td></tr>';
}

function renderClasses() {
  $('class-rows').innerHTML = db.classes.length
    ? db.classes.map((item) => `
      <tr>
        <td><strong>${esc(item.name)}</strong></td>
        <td>${esc(item.grade)}</td>
        <td>${esc(item.room || '—')}</td>
        <td>${esc(teacherName(item.teacherId))}</td>
        <td><div class="row-actions">
          <button type="button" class="row-btn" data-edit-class="${esc(item.id)}">Edit</button>
          <button type="button" class="row-btn delete" data-delete-class="${esc(item.id)}">Delete</button>
        </div></td>
      </tr>`).join('')
    : '<tr><td colspan="5" class="empty">No classes yet.</td></tr>';
}

function renderAttendance() {
  const date = $('attendance-date').value || todayISO();
  $('attendance-date').value = date;
  const classId = $('attendance-class').value;
  const students = db.students.filter((student) => student.classId === classId);
  const records = db.attendance[`${date}|${classId}`] || {};
  const present = students.filter((student) => records[student.id] === 'present').length;
  const absent = students.filter((student) => records[student.id] === 'absent').length;
  const unmarked = students.length - present - absent;

  $('attendance-summary').innerHTML = students.length
    ? `<strong>${esc(className(classId))}</strong> · ${present} present · ${absent} absent · ${unmarked} unmarked`
    : 'No students in this class yet.';

  $('attendance-list').innerHTML = students.length
    ? students.map((student) => {
      const status = records[student.id];
      return `
        <div class="att-row">
          <span class="who">${esc(student.name)}<small>${esc(student.email)}</small></span>
          <div class="att-buttons">
            <button type="button" class="${status === 'present' ? 'active present' : ''}" data-att="present" data-student="${esc(student.id)}">Present</button>
            <button type="button" class="${status === 'absent' ? 'active absent' : ''}" data-att="absent" data-student="${esc(student.id)}">Absent</button>
          </div>
        </div>`;
    }).join('')
    : '<p class="empty">Choose a class with students to take attendance.</p>';
}

function renderGrades() {
  const average = db.grades.length
    ? Math.round(db.grades.reduce((sum, grade) => sum + Number(grade.score), 0) / db.grades.length)
    : null;
  $('grade-summary').innerHTML = average === null
    ? 'No grades recorded yet.'
    : `Class average: <strong>${average}%</strong> across <strong>${db.grades.length}</strong> grade${db.grades.length === 1 ? '' : 's'}.`;

  $('grade-rows').innerHTML = db.grades.length
    ? db.grades.map((grade) => {
      const info = gradeInfo(Number(grade.score));
      const date = new Date(grade.date);
      const stamp = Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString();
      return `
        <tr>
          <td>${esc(studentName(grade.studentId))}</td>
          <td>${esc(grade.subject)}<span class="sub">${esc(stamp)}</span></td>
          <td><strong>${Number(grade.score)}%</strong></td>
          <td><span class="badge ${info.cls}">${info.label}</span></td>
          <td><div class="row-actions">
            <button type="button" class="row-btn" data-edit-grade="${esc(grade.id)}">Edit</button>
            <button type="button" class="row-btn delete" data-delete-grade="${esc(grade.id)}">Delete</button>
          </div></td>
        </tr>`;
    }).join('')
    : '<tr><td colspan="5" class="empty">No grades recorded yet.</td></tr>';
}

function renderAll() {
  populateSelects();
  renderDashboard();
  renderStudents();
  renderTeachers();
  renderClasses();
  renderAttendance();
  renderGrades();
}

const SECTIONS = {
  dashboard: ['Dashboard', 'A quick overview of your school.'],
  students: ['Students', 'Manage the student roster and contact details.'],
  teachers: ['Teachers', 'Manage faculty and the subjects they teach.'],
  classes: ['Classes', 'Organize grade levels, rooms and homerooms.'],
  attendance: ['Attendance', 'Mark daily attendance class by class.'],
  grades: ['Grades', 'Record scores and track performance.']
};

function showSection(name) {
  document.querySelectorAll('.view').forEach((view) => { view.hidden = view.id !== `view-${name}`; });
  document.querySelectorAll('.nav-item').forEach((button) => button.classList.toggle('active', button.dataset.section === name));
  $('sectionTitle').textContent = SECTIONS[name][0];
  $('sectionSubtitle').textContent = SECTIONS[name][1];
}

document.querySelectorAll('.nav-item').forEach((button) => {
  button.addEventListener('click', () => showSection(button.dataset.section));
});
document.querySelectorAll('[data-goto]').forEach((button) => {
  button.addEventListener('click', () => showSection(button.dataset.goto));
});

function beginEdit(prefix, title, name) {
  $(`${prefix}-form-title`).textContent = `Edit ${name}`;
  $(`${prefix}-submit`).textContent = `Update ${name}`;
  $(`${prefix}-cancel`).hidden = false;
  $(`${prefix}-name`).focus();
}

function resetForm(prefix, label) {
  $(`${prefix}-form`).reset();
  $(`${prefix}-edit-id`).value = '';
  $(`${prefix}-form-title`).textContent = `Add ${label}`;
  $(`${prefix}-submit`).textContent = `Add ${label}`;
  $(`${prefix}-cancel`).hidden = true;
}

$('student-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const id = $('student-edit-id').value;
  const data = {
    name: $('student-name').value.trim(),
    email: $('student-email').value.trim(),
    classId: $('student-class').value,
    phone: $('student-phone').value.trim()
  };
  if (id) {
    Object.assign(db.students.find((item) => item.id === id), data);
    logActivity(`Updated student ${data.name}`);
  } else {
    db.students.unshift({ id: uid('s'), ...data });
    logActivity(`Added student ${data.name}`);
  }
  save();
  resetForm('student', 'student');
  renderAll();
});

$('teacher-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const id = $('teacher-edit-id').value;
  const data = {
    name: $('teacher-name').value.trim(),
    subject: $('teacher-subject').value.trim(),
    email: $('teacher-email').value.trim(),
    phone: $('teacher-phone').value.trim()
  };
  if (id) {
    Object.assign(db.teachers.find((item) => item.id === id), data);
    logActivity(`Updated teacher ${data.name}`);
  } else {
    db.teachers.unshift({ id: uid('t'), ...data });
    logActivity(`Added teacher ${data.name}`);
  }
  save();
  resetForm('teacher', 'teacher');
  renderAll();
});

$('class-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const id = $('class-edit-id').value;
  const data = {
    name: $('class-name').value.trim(),
    grade: $('class-grade').value.trim(),
    room: $('class-room').value.trim(),
    teacherId: $('class-teacher').value
  };
  if (id) {
    Object.assign(db.classes.find((item) => item.id === id), data);
    logActivity(`Updated class ${data.name}`);
  } else {
    db.classes.unshift({ id: uid('c'), ...data });
    logActivity(`Added class ${data.name}`);
  }
  save();
  resetForm('class', 'class');
  renderAll();
});

$('grade-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const id = $('grade-edit-id').value;
  const data = {
    studentId: $('grade-student').value,
    subject: $('grade-subject').value.trim(),
    score: Number($('grade-score').value),
    date: new Date().toISOString()
  };
  if (id) {
    Object.assign(db.grades.find((item) => item.id === id), data);
    logActivity(`Updated grade for ${studentName(data.studentId)}`);
  } else {
    db.grades.unshift({ id: uid('g'), ...data });
    logActivity(`Recorded grade for ${studentName(data.studentId)}`);
  }
  save();
  $('grade-form').reset();
  $('grade-edit-id').value = '';
  $('grade-form-title').textContent = 'Record a grade';
  $('grade-submit').textContent = 'Save grade';
  $('grade-cancel').hidden = true;
  renderAll();
});

$('student-search').addEventListener('input', renderStudents);
$('attendance-date').addEventListener('change', renderAttendance);
$('attendance-class').addEventListener('change', renderAttendance);

$('attendance-list').addEventListener('click', (event) => {
  const button = event.target.closest('button[data-att]');
  if (!button) return;
  const key = `${$('attendance-date').value}|${$('attendance-class').value}`;
  db.attendance[key] = db.attendance[key] || {};
  if (db.attendance[key][button.dataset.student] === button.dataset.att) {
    delete db.attendance[key][button.dataset.student];
  } else {
    db.attendance[key][button.dataset.student] = button.dataset.att;
  }
  save();
  renderAttendance();
  renderDashboard();
});

$('mark-all-btn').addEventListener('click', () => {
  const classId = $('attendance-class').value;
  const key = `${$('attendance-date').value}|${classId}`;
  db.attendance[key] = db.attendance[key] || {};
  db.students.filter((student) => student.classId === classId).forEach((student) => {
    db.attendance[key][student.id] = 'present';
  });
  logActivity(`Marked all present for ${className(classId)}`);
  save();
  renderAttendance();
  renderDashboard();
});

$('student-rows').addEventListener('click', (event) => {
  const edit = event.target.closest('[data-edit-student]');
  const remove = event.target.closest('[data-delete-student]');
  if (edit) {
    const student = db.students.find((item) => item.id === edit.dataset.editStudent);
    if (!student) return;
    $('student-edit-id').value = student.id;
    $('student-name').value = student.name;
    $('student-email').value = student.email;
    $('student-class').value = student.classId;
    $('student-phone').value = student.phone || '';
    beginEdit('student', 'student', 'student');
  }
  if (remove) {
    const student = db.students.find((item) => item.id === remove.dataset.deleteStudent);
    if (!student || !confirm(`Delete ${student.name}?`)) return;
    db.students = db.students.filter((item) => item.id !== student.id);
    db.grades = db.grades.filter((item) => item.studentId !== student.id);
    Object.values(db.attendance).forEach((day) => { delete day[student.id]; });
    logActivity(`Deleted student ${student.name}`);
    save();
    resetForm('student', 'student');
    renderAll();
  }
});

$('teacher-rows').addEventListener('click', (event) => {
  const edit = event.target.closest('[data-edit-teacher]');
  const remove = event.target.closest('[data-delete-teacher]');
  if (edit) {
    const teacher = db.teachers.find((item) => item.id === edit.dataset.editTeacher);
    if (!teacher) return;
    $('teacher-edit-id').value = teacher.id;
    $('teacher-name').value = teacher.name;
    $('teacher-subject').value = teacher.subject;
    $('teacher-email').value = teacher.email;
    $('teacher-phone').value = teacher.phone || '';
    beginEdit('teacher', 'teacher', 'teacher');
  }
  if (remove) {
    const teacher = db.teachers.find((item) => item.id === remove.dataset.deleteTeacher);
    if (!teacher || !confirm(`Delete ${teacher.name}?`)) return;
    db.teachers = db.teachers.filter((item) => item.id !== teacher.id);
    db.classes.forEach((item) => { if (item.teacherId === teacher.id) item.teacherId = db.teachers[0]?.id || ''; });
    logActivity(`Deleted teacher ${teacher.name}`);
    save();
    resetForm('teacher', 'teacher');
    renderAll();
  }
});

$('class-rows').addEventListener('click', (event) => {
  const edit = event.target.closest('[data-edit-class]');
  const remove = event.target.closest('[data-delete-class]');
  if (edit) {
    const item = db.classes.find((entry) => entry.id === edit.dataset.editClass);
    if (!item) return;
    $('class-edit-id').value = item.id;
    $('class-name').value = item.name;
    $('class-grade').value = item.grade;
    $('class-room').value = item.room || '';
    $('class-teacher').value = item.teacherId;
    beginEdit('class', 'class', 'class');
  }
  if (remove) {
    const item = db.classes.find((entry) => entry.id === remove.dataset.deleteClass);
    if (!item || !confirm(`Delete class ${item.name}? Students will become unassigned.`)) return;
    db.classes = db.classes.filter((entry) => entry.id !== item.id);
    db.students.forEach((student) => { if (student.classId === item.id) student.classId = ''; });
    logActivity(`Deleted class ${item.name}`);
    save();
    resetForm('class', 'class');
    renderAll();
  }
});

$('grade-rows').addEventListener('click', (event) => {
  const edit = event.target.closest('[data-edit-grade]');
  const remove = event.target.closest('[data-delete-grade]');
  if (edit) {
    const grade = db.grades.find((item) => item.id === edit.dataset.editGrade);
    if (!grade) return;
    $('grade-edit-id').value = grade.id;
    $('grade-student').value = grade.studentId;
    $('grade-subject').value = grade.subject;
    $('grade-score').value = grade.score;
    $('grade-form-title').textContent = 'Edit grade';
    $('grade-submit').textContent = 'Update grade';
    $('grade-cancel').hidden = false;
    $('grade-subject').focus();
  }
  if (remove) {
    const grade = db.grades.find((item) => item.id === remove.dataset.deleteGrade);
    if (!grade || !confirm('Delete this grade?')) return;
    db.grades = db.grades.filter((item) => item.id !== grade.id);
    logActivity(`Deleted grade for ${studentName(grade.studentId)}`);
    save();
    renderAll();
  }
});

['student', 'teacher', 'class'].forEach((prefix) => {
  $(`${prefix}-cancel`).addEventListener('click', () => {
    resetForm(prefix, prefix);
  });
});
$('grade-cancel').addEventListener('click', () => {
  $('grade-form').reset();
  $('grade-edit-id').value = '';
  $('grade-form-title').textContent = 'Record a grade';
  $('grade-submit').textContent = 'Save grade';
  $('grade-cancel').hidden = true;
});

$('resetBtn').addEventListener('click', () => {
  if (!confirm('Reset all data to the original demo records?')) return;
  db = seedData();
  save();
  renderAll();
});

$('today').textContent = new Date().toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
$('attendance-date').value = todayISO();
renderAll();
