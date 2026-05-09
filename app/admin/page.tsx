'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { Programme, Level, Session, Course } from '@/lib/supabase'
import {
  Upload, Plus, Trash2, LogOut, BookOpen,
  Loader2, CheckCircle, AlertCircle, X, ChevronDown
} from 'lucide-react'
import Link from 'next/link'

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123'

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')

  const [programmes, setProgrammes] = useState<Programme[]>([])
  const [levels, setLevels] = useState<Level[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [courses, setCourses] = useState<Course[]>([])

  const [selProgramme, setSelProgramme] = useState('')
  const [selLevel, setSelLevel] = useState('')
  const [selSession, setSelSession] = useState('')
  const [selCourse, setSelCourse] = useState('')

  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error', msg: string } | null>(null)

  // New item forms
  const [newProgramme, setNewProgramme] = useState('')
  const [newCourseCode, setNewCourseCode] = useState('')
  const [newCourseTitle, setNewCourseTitle] = useState('')
  const [addingProgramme, setAddingProgramme] = useState(false)
  const [addingCourse, setAddingCourse] = useState(false)

  const fileRef = useRef<HTMLInputElement>(null)

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 4000)
  }

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setAuthed(true)
      setAuthError('')
    } else {
      setAuthError('Incorrect password')
    }
  }

  useEffect(() => {
    if (!authed) return
    const load = async () => {
      const [{ data: progs }, { data: lvls }, { data: sess }] = await Promise.all([
        supabase.from('programmes').select('*').order('name'),
        supabase.from('levels').select('*').order('name'),
        supabase.from('sessions').select('*').order('name', { ascending: false }),
      ])
      if (progs) setProgrammes(progs)
      if (lvls) setLevels(lvls)
      if (sess) setSessions(sess)
    }
    load()
  }, [authed])

  useEffect(() => {
    if (!selProgramme || !selLevel) { setCourses([]); return }
    const load = async () => {
      const { data } = await supabase
        .from('courses').select('*')
        .eq('programme_id', selProgramme)
        .eq('level_id', selLevel)
        .order('course_code')
      if (data) setCourses(data)
    }
    load()
  }, [selProgramme, selLevel])

  const handleUpload = async () => {
    if (!file || !selCourse || !selSession) {
      showToast('error', 'Please select a course, session, and PDF file.')
      return
    }
    setUploading(true)
    try {
      const course = courses.find(c => String(c.id) === selCourse)
      const session = sessions.find(s => String(s.id) === selSession)
      const prog = programmes.find(p => String(p.id) === selProgramme)
      const level = levels.find(l => String(l.id) === selLevel)

      const fileName = `${prog?.name.toLowerCase()}/${level?.name.toLowerCase()}/${session?.name.replace('/', '-')}/${course?.course_code.toLowerCase()}-${Date.now()}.pdf`

      const { error: uploadError } = await supabase.storage
        .from('past-questions')
        .upload(fileName, file, { upsert: false })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('past-questions')
        .getPublicUrl(fileName)

      const { error: dbError } = await supabase.from('past_questions').insert({
        course_id: parseInt(selCourse),
        session_id: parseInt(selSession),
        pdf_url: urlData.publicUrl,
        download_count: 0,
      })

      if (dbError) throw dbError

      showToast('success', `${course?.course_code} uploaded successfully!`)
      setFile(null)
      if (fileRef.current) fileRef.current.value = ''
    } catch (err: any) {
      showToast('error', err.message || 'Upload failed.')
    }
    setUploading(false)
  }

  const handleAddProgramme = async () => {
    if (!newProgramme.trim()) return
    setAddingProgramme(true)
    const { data, error } = await supabase
      .from('programmes').insert({ name: newProgramme.trim() }).select().single()
    if (error) { showToast('error', error.message); }
    else { setProgrammes(p => [...p, data]); setNewProgramme(''); showToast('success', 'Programme added!') }
    setAddingProgramme(false)
  }

  const handleAddCourse = async () => {
    if (!newCourseCode.trim() || !newCourseTitle.trim() || !selProgramme || !selLevel) {
      showToast('error', 'Fill in all course fields and select programme + level.')
      return
    }
    setAddingCourse(true)
    const { data, error } = await supabase.from('courses').insert({
      course_code: newCourseCode.trim().toUpperCase(),
      title: newCourseTitle.trim(),
      programme_id: parseInt(selProgramme),
      level_id: parseInt(selLevel),
    }).select().single()
    if (error) { showToast('error', error.message) }
    else { setCourses(c => [...c, data]); setNewCourseCode(''); setNewCourseTitle(''); showToast('success', 'Course added!') }
    setAddingCourse(false)
  }

  const Select = ({ label, value, onChange, options, placeholder, disabled }: any) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-display font-600 uppercase tracking-widest text-gray-500">{label}</label>
      <div className="relative">
        <select
          value={value} onChange={e => onChange(e.target.value)} disabled={disabled}
          className="w-full appearance-none bg-dark-700 border border-dark-500 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-brand-500 disabled:opacity-40 cursor-pointer transition-colors hover:border-dark-400"
        >
          <option value="">{placeholder}</option>
          {options.map((o: any) => <option key={o.id} value={String(o.id)}>{o.name}</option>)}
        </select>
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" />
      </div>
    </div>
  )

  if (!authed) {
    return (
      <div className="min-h-screen mesh-bg flex items-center justify-center p-6">
        <div className="w-full max-w-sm bg-dark-800 border border-dark-600 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
              <BookOpen size={16} />
            </div>
            <span className="font-display font-700 text-lg">PastQ Admin</span>
          </div>
          <h1 className="font-display font-700 text-2xl mb-1">Sign in</h1>
          <p className="text-gray-500 text-sm mb-6">Enter your admin password to continue.</p>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            className="w-full bg-dark-700 border border-dark-500 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-brand-500 mb-3 transition-colors"
          />
          {authError && <p className="text-red-400 text-xs mb-3">{authError}</p>}
          <button
            onClick={handleLogin}
            className="w-full bg-brand-500 hover:bg-brand-400 text-white font-display font-700 text-sm uppercase tracking-widest py-3.5 rounded-xl transition-colors"
          >
            Sign In
          </button>
          <Link href="/" className="block text-center text-gray-600 text-xs mt-4 hover:text-gray-400 transition-colors">
            ← Back to portal
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen mesh-bg">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl border text-sm font-body animate-fade-up shadow-2xl ${
          toast.type === 'success'
            ? 'bg-green-900/80 border-green-700 text-green-200'
            : 'bg-red-900/80 border-red-700 text-red-200'
        }`}>
          {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
          <button onClick={() => setToast(null)}><X size={14} /></button>
        </div>
      )}

      {/* Nav */}
      <nav className="border-b border-dark-600/50 bg-dark-900/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
              <BookOpen size={16} />
            </div>
            <span className="font-display font-700">PastQ</span>
            <span className="text-xs text-brand-400 bg-brand-500/10 border border-brand-500/20 px-2 py-0.5 rounded-full font-display">Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">View Portal</Link>
            <button onClick={() => setAuthed(false)} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-400 transition-colors">
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-10 grid gap-6">
        <div>
          <h1 className="font-display font-800 text-3xl">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Upload PDFs, manage programmes and courses.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Upload Section */}
          <div className="bg-dark-800/80 border border-dark-600/40 rounded-2xl p-6">
            <h2 className="font-display font-700 text-lg mb-5 flex items-center gap-2">
              <Upload size={18} className="text-brand-400" /> Upload Past Question
            </h2>
            <div className="grid gap-4">
              <Select label="Programme" value={selProgramme}
                onChange={(v: string) => { setSelProgramme(v); setSelLevel(''); setSelCourse('') }}
                options={programmes} placeholder="Select Programme" />
              <Select label="Level" value={selLevel}
                onChange={(v: string) => { setSelLevel(v); setSelCourse('') }}
                options={levels} placeholder="Select Level" />
              <Select label="Session" value={selSession} onChange={setSelSession}
                options={sessions} placeholder="Select Session" />
              <Select label="Course" value={selCourse} onChange={setSelCourse}
                options={courses.map(c => ({ id: c.id, name: `${c.course_code} — ${c.title}` }))}
                placeholder={!selProgramme || !selLevel ? 'Select Programme & Level first' : 'Select Course'}
                disabled={!selProgramme || !selLevel} />

              {/* File drop zone */}
              <div
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  file ? 'border-brand-500/60 bg-brand-500/5' : 'border-dark-500 hover:border-dark-400'
                }`}
              >
                <input
                  ref={fileRef} type="file" accept=".pdf" className="hidden"
                  onChange={e => setFile(e.target.files?.[0] || null)}
                />
                {file ? (
                  <div>
                    <CheckCircle size={24} className="text-brand-400 mx-auto mb-2" />
                    <p className="text-white text-sm font-display font-600 truncate">{file.name}</p>
                    <p className="text-gray-500 text-xs mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <div>
                    <Upload size={24} className="text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">Click to select PDF</p>
                    <p className="text-gray-600 text-xs mt-1">Only .pdf files accepted</p>
                  </div>
                )}
              </div>

              <button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full bg-brand-500 hover:bg-brand-400 disabled:opacity-60 text-white font-display font-700 text-sm uppercase tracking-widest py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {uploading ? <><Loader2 size={16} className="animate-spin" /> Uploading...</> : <><Upload size={16} /> Upload PDF</>}
              </button>
            </div>
          </div>

          {/* Manage Section */}
          <div className="flex flex-col gap-6">
            {/* Add Programme */}
            <div className="bg-dark-800/80 border border-dark-600/40 rounded-2xl p-6">
              <h2 className="font-display font-700 text-lg mb-4 flex items-center gap-2">
                <Plus size={18} className="text-brand-400" /> Add Programme
              </h2>
              <div className="flex gap-3">
                <input
                  type="text" placeholder="e.g. Physiotherapy"
                  value={newProgramme} onChange={e => setNewProgramme(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddProgramme()}
                  className="flex-1 bg-dark-700 border border-dark-500 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-brand-500 transition-colors"
                />
                <button
                  onClick={handleAddProgramme} disabled={addingProgramme}
                  className="bg-brand-500 hover:bg-brand-400 text-white px-4 py-3 rounded-xl transition-colors disabled:opacity-60"
                >
                  {addingProgramme ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {programmes.map(p => (
                  <span key={p.id} className="text-xs bg-dark-700 border border-dark-500 text-gray-300 px-3 py-1 rounded-full font-body">
                    {p.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Add Course */}
            <div className="bg-dark-800/80 border border-dark-600/40 rounded-2xl p-6">
              <h2 className="font-display font-700 text-lg mb-4 flex items-center gap-2">
                <Plus size={18} className="text-brand-400" /> Add Course
              </h2>
              <div className="grid gap-3">
                <Select label="Programme" value={selProgramme}
                  onChange={(v: string) => { setSelProgramme(v); setSelLevel('') }}
                  options={programmes} placeholder="Select Programme" />
                <Select label="Level" value={selLevel} onChange={setSelLevel}
                  options={levels} placeholder="Select Level" />
                <input
                  type="text" placeholder="Course Code (e.g. MLS101)"
                  value={newCourseCode} onChange={e => setNewCourseCode(e.target.value)}
                  className="bg-dark-700 border border-dark-500 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-brand-500 transition-colors"
                />
                <input
                  type="text" placeholder="Course Title (e.g. General Anatomy)"
                  value={newCourseTitle} onChange={e => setNewCourseTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddCourse()}
                  className="bg-dark-700 border border-dark-500 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-brand-500 transition-colors"
                />
                <button
                  onClick={handleAddCourse} disabled={addingCourse}
                  className="w-full bg-dark-700 hover:bg-dark-600 border border-dark-500 hover:border-brand-500/40 text-white font-display font-600 text-sm uppercase tracking-widest py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  {addingCourse ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  Add Course
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
