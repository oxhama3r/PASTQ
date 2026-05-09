'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Programme, Level, Session, Course, PastQuestion } from '@/lib/supabase'
import { BookOpen, Download, Search, FileText, ChevronDown, Loader2, Shield } from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  const [programmes, setProgrammes] = useState<Programme[]>([])
  const [levels, setLevels] = useState<Level[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [results, setResults] = useState<PastQuestion[]>([])

  const [selectedProgramme, setSelectedProgramme] = useState('')
  const [selectedLevel, setSelectedLevel] = useState('')
  const [selectedSession, setSelectedSession] = useState('')
  const [selectedCourse, setSelectedCourse] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [downloading, setDownloading] = useState<number | null>(null)

  // Load filter options on mount
  useEffect(() => {
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
  }, [])

  // Load courses when programme + level selected
  useEffect(() => {
    if (!selectedProgramme || !selectedLevel) { setCourses([]); return }
    const loadCourses = async () => {
      const { data } = await supabase
        .from('courses')
        .select('*')
        .eq('programme_id', selectedProgramme)
        .eq('level_id', selectedLevel)
        .order('course_code')
      if (data) setCourses(data)
    }
    loadCourses()
  }, [selectedProgramme, selectedLevel])

  const handleSearch = async () => {
    setLoading(true)
    setSearched(true)

    let query = supabase
      .from('past_questions')
      .select(`
        *,
        course:courses(*),
        session:sessions(*)
      `)

    if (selectedCourse) {
      query = query.eq('course_id', selectedCourse)
    } else if (selectedProgramme && selectedLevel) {
      // Get all course IDs for this programme + level
      const { data: courseIds } = await supabase
        .from('courses')
        .select('id')
        .eq('programme_id', selectedProgramme)
        .eq('level_id', selectedLevel)
      if (courseIds) {
        query = query.in('course_id', courseIds.map(c => c.id))
      }
    }

    if (selectedSession) query = query.eq('session_id', selectedSession)

    if (searchQuery) {
      const { data: matchedCourses } = await supabase
        .from('courses')
        .select('id')
        .or(`course_code.ilike.%${searchQuery}%,title.ilike.%${searchQuery}%`)
      if (matchedCourses) {
        query = query.in('course_id', matchedCourses.map(c => c.id))
      }
    }

    const { data } = await query.order('uploaded_at', { ascending: false })
    setResults(data || [])
    setLoading(false)
  }

  const handleDownload = async (pq: PastQuestion) => {
    setDownloading(pq.id)
    // Increment download count
    await supabase
      .from('past_questions')
      .update({ download_count: (pq.download_count || 0) + 1 })
      .eq('id', pq.id)

    // Open PDF in new tab
    window.open(pq.pdf_url, '_blank')
    setDownloading(null)
  }

  const SelectField = ({ label, value, onChange, options, placeholder, disabled }: {
    label: string
    value: string
    onChange: (v: string) => void
    options: { id: number | string, name: string }[]
    placeholder: string
    disabled?: boolean
  }) => (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-display font-600 uppercase tracking-widest text-gray-400">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          className={`
            w-full appearance-none bg-dark-700 border border-dark-500 rounded-xl px-4 py-3
            text-white font-body text-sm outline-none transition-all duration-200
            focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20
            disabled:opacity-40 disabled:cursor-not-allowed
            hover:border-dark-400 cursor-pointer
          `}
        >
          <option value="">{placeholder}</option>
          {options.map(o => (
            <option key={o.id} value={String(o.id)}>{o.name}</option>
          ))}
        </select>
        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen mesh-bg grain">
      {/* Nav */}
      <nav className="border-b border-dark-600/50 backdrop-blur-sm sticky top-0 z-50 bg-dark-900/80">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
              <BookOpen size={16} className="text-white" />
            </div>
            <span className="font-display font-700 text-lg tracking-tight">PastQ</span>
          </div>
          <Link
            href="/admin"
            className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            <Shield size={14} />
            Admin
          </Link>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-16 animate-fade-up">
          <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 rounded-full px-4 py-2 text-brand-400 text-xs font-display font-600 uppercase tracking-widest mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
            Past Questions Portal
          </div>
          <h1 className="font-display font-800 text-5xl md:text-7xl tracking-tight leading-none mb-6 glow-text">
            Find Your
            <span className="block text-brand-400">Past Questions</span>
          </h1>
          <p className="text-gray-400 font-body text-lg max-w-xl mx-auto leading-relaxed">
            Browse and download past exam questions by programme, level, and session. Study smarter.
          </p>
        </div>

        {/* Search Card */}
        <div
          className="bg-dark-800/80 backdrop-blur-sm border border-dark-600/50 rounded-2xl p-8 mb-8 glow-orange animate-fade-up delay-200"
        >
          {/* Text Search */}
          <div className="relative mb-6">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search by course code or title (e.g. MLS101, Anatomy)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="w-full bg-dark-700 border border-dark-500 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-gray-600 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
            />
          </div>

          {/* Filters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <SelectField
              label="Programme"
              value={selectedProgramme}
              onChange={v => { setSelectedProgramme(v); setSelectedLevel(''); setSelectedCourse('') }}
              options={programmes}
              placeholder="All Programmes"
            />
            <SelectField
              label="Level"
              value={selectedLevel}
              onChange={v => { setSelectedLevel(v); setSelectedCourse('') }}
              options={levels}
              placeholder="All Levels"
            />
            <SelectField
              label="Session"
              value={selectedSession}
              onChange={setSelectedSession}
              options={sessions}
              placeholder="All Sessions"
            />
            <SelectField
              label="Course"
              value={selectedCourse}
              onChange={setSelectedCourse}
              options={courses.map(c => ({ id: c.id, name: `${c.course_code} — ${c.title}` }))}
              placeholder={!selectedProgramme || !selectedLevel ? 'Select Programme & Level' : 'All Courses'}
              disabled={!selectedProgramme || !selectedLevel}
            />
          </div>

          {/* Search Button */}
          <button
            onClick={handleSearch}
            disabled={loading}
            className="w-full bg-brand-500 hover:bg-brand-400 text-white font-display font-700 text-sm uppercase tracking-widest py-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-60"
          >
            {loading ? (
              <><Loader2 size={18} className="animate-spin" /> Searching...</>
            ) : (
              <><Search size={18} /> Search Past Questions</>
            )}
          </button>
        </div>

        {/* Results */}
        {searched && (
          <div className="animate-fade-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-700 text-xl">
                {results.length > 0 ? `${results.length} Result${results.length !== 1 ? 's' : ''} Found` : 'No Results'}
              </h2>
              {results.length > 0 && (
                <span className="text-xs text-gray-500 font-body">Click to download PDF</span>
              )}
            </div>

            {results.length === 0 && !loading && (
              <div className="text-center py-20 bg-dark-800/50 rounded-2xl border border-dark-600/30">
                <FileText size={48} className="text-gray-700 mx-auto mb-4" />
                <p className="text-gray-500 font-body">No past questions found for your selection.</p>
                <p className="text-gray-600 text-sm mt-1">Try adjusting your filters or search term.</p>
              </div>
            )}

            <div className="grid gap-3">
              {results.map((pq, i) => (
                <div
                  key={pq.id}
                  className="bg-dark-800/60 border border-dark-600/40 rounded-xl p-5 flex items-center justify-between group hover:border-brand-500/40 hover:bg-dark-700/60 transition-all duration-200 animate-fade-up"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center flex-shrink-0">
                      <FileText size={18} className="text-brand-400" />
                    </div>
                    <div>
                      <p className="font-display font-600 text-white text-sm">
                        {pq.course?.course_code} — {pq.course?.title}
                      </p>
                      <p className="text-gray-500 text-xs mt-0.5 font-body">
                        Session: {pq.session?.name} &nbsp;·&nbsp; {pq.download_count || 0} downloads
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownload(pq)}
                    disabled={downloading === pq.id}
                    className="flex items-center gap-2 bg-brand-500/10 hover:bg-brand-500 border border-brand-500/30 hover:border-brand-500 text-brand-400 hover:text-white text-xs font-display font-600 uppercase tracking-wider px-4 py-2.5 rounded-lg transition-all duration-200 flex-shrink-0"
                  >
                    {downloading === pq.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Download size={14} />
                    )}
                    Download
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats / CTA */}
        {!searched && (
          <div className="grid grid-cols-3 gap-4 mt-8 animate-fade-up delay-400">
            {[
              { label: 'Programmes', value: programmes.length || '—' },
              { label: 'Sessions', value: sessions.length || '—' },
              { label: 'Free Access', value: '100%' },
            ].map(s => (
              <div key={s.label} className="text-center bg-dark-800/40 border border-dark-600/30 rounded-xl py-6">
                <p className="font-display font-800 text-3xl text-brand-400">{s.value}</p>
                <p className="text-gray-500 text-xs uppercase tracking-widest mt-1 font-display">{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-dark-700/50 mt-20 py-8 text-center text-gray-600 text-sm font-body">
        PastQ · Built for students, by students
      </footer>
    </div>
  )
}
