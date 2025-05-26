import React, { useEffect, useState } from 'react';
import axios from '../api';

interface Unit {
  id: string;
  number: number;
  title: string;
  description?: string;
}

interface Question {
  id: string;
  content: string;
  options: string[];
  answer: string;
  createdAt: string;
}

const Teacher: React.FC = () => {
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<string>('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [form, setForm] = useState<{
    content: string;
    options: string[] | string;
    answer: string;
    scoring?: string;
    feedback?: string;
  }>({
    content: '',
    options: ['', ''],
    answer: '',
    scoring: '',
    feedback: '',
  });
  const [unitForm, setUnitForm] = useState({
    title: '',
    number: '',
    description: '',
  });
  const [unitError, setUnitError] = useState('');
  const [unitSuccess, setUnitSuccess] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [bulkJson, setBulkJson] = useState('');
  const [bulkResult, setBulkResult] = useState<any[] | null>(null);
  const [bulkError, setBulkError] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [questionType, setQuestionType] = useState('multiple_choice');
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>(null);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  // Fetch units on mount and after unit creation
  const fetchUnits = async () => {
    try {
      const res = await axios.get('/units');
      setUnits(res.data.units);
      if (res.data.units.length > 0 && !selectedUnit) {
        setSelectedUnit(res.data.units[0].id);
      }
    } catch (err) {
      setUnitError('Failed to load units');
    }
  };

  useEffect(() => {
    fetchUnits();
    // eslint-disable-next-line
  }, []);

  // Fetch questions when selectedUnit changes
  useEffect(() => {
    if (!selectedUnit) return;
    const fetchQuestions = async () => {
      try {
        const res = await axios.get('/questions', { params: { unitId: selectedUnit } });
        setQuestions(res.data.questions);
      } catch (err) {
        setQuestions([]);
      }
    };
    fetchQuestions();
  }, [selectedUnit]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, idx?: number) => {
    if (e.target.name === 'options' && typeof idx === 'number') {
      const newOptions = [...form.options] as string[];
      newOptions[idx] = e.target.value;
      setForm({ ...form, options: newOptions });
    } else {
      setForm({ ...form, [e.target.name]: e.target.value });
    }
  };

  const addOption = () => {
    setForm({ ...form, options: [...form.options, ''] });
  };

  const removeOption = (idx: number) => {
    if (Array.isArray(form.options) && form.options.length <= 2) return;
    if (Array.isArray(form.options)) {
      const newOptions = form.options.filter((_, i) => i !== idx);
      setForm({ ...form, options: newOptions });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!selectedUnit) {
      setError('Please select a unit');
      return;
    }
    let options: any = form.options;
    let answer = form.answer;
    if (questionType === 'drag_and_drop' || questionType === 'sortable') {
      try {
        options = JSON.parse(form.options as any);
      } catch {
        setError('Options must be valid JSON for this type');
        return;
      }
    }
    if (questionType === 'matching') {
      try {
        options = JSON.parse(form.options as any);
      } catch {
        setError('Options must be valid JSON for this type');
        return;
      }
      answer = '';
    }
    try {
      await axios.post('/questions', {
        content: form.content,
        type: questionType,
        unitId: selectedUnit,
        options,
        answer,
        scoring: form.scoring,
        feedback: form.feedback,
      });
      setSuccess('Question created!');
      setForm({ content: '', options: questionType === 'multiple_choice' ? ['', ''] : '', answer: '', scoring: '', feedback: '' });
      // Refresh questions
      const res = await axios.get('/questions', { params: { unitId: selectedUnit } });
      setQuestions(res.data.questions);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create question');
    }
  };

  // Handle unit form
  const handleUnitFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setUnitForm({ ...unitForm, [e.target.name]: e.target.value });
  };

  const handleUnitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnitError('');
    setUnitSuccess('');
    if (!unitForm.title || !unitForm.number) {
      setUnitError('Title and number are required');
      return;
    }
    try {
      await axios.post('/units', {
        title: unitForm.title,
        number: parseInt(unitForm.number, 10),
        description: unitForm.description,
      });
      setUnitSuccess('Unit created!');
      setUnitForm({ title: '', number: '', description: '' });
      fetchUnits();
    } catch (err: any) {
      setUnitError(err.response?.data?.message || 'Failed to create unit');
    }
  };

  // Bulk import handler
  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setBulkError('');
    setBulkResult(null);
    setBulkLoading(true);
    let parsed: any[];
    try {
      parsed = JSON.parse(bulkJson);
      if (!Array.isArray(parsed)) throw new Error('JSON must be an array');
    } catch (err: any) {
      setBulkError('Invalid JSON: ' + err.message);
      setBulkLoading(false);
      return;
    }
    try {
      const res = await axios.post('/questions/bulk', parsed);
      setBulkResult(res.data.results);
      // Optionally refresh questions if unit matches
      if (selectedUnit) {
        const qres = await axios.get('/questions', { params: { unitId: selectedUnit } });
        setQuestions(qres.data.questions);
      }
    } catch (err: any) {
      setBulkError(err.response?.data?.message || 'Bulk import failed');
    }
    setBulkLoading(false);
  };

  return (
    <div style={{ maxWidth: 700, margin: 'auto', padding: 20 }}>
      <h2>Teacher Dashboard</h2>
      <p>Welcome! Here you can manage units, questions, and assignments.</p>

      <h3>Create Unit</h3>
      <form onSubmit={handleUnitSubmit} style={{ background: '#f8f8f8', padding: 16, borderRadius: 8, marginBottom: 24 }}>
        <div>
          <label>Title:</label>
          <input name="title" value={unitForm.title} onChange={handleUnitFormChange} required style={{ width: '100%' }} />
        </div>
        <div>
          <label>Number:</label>
          <input name="number" type="number" min={1} value={unitForm.number} onChange={handleUnitFormChange} required style={{ width: '100%' }} />
        </div>
        <div>
          <label>Description:</label>
          <textarea name="description" value={unitForm.description} onChange={handleUnitFormChange} rows={2} style={{ width: '100%' }} />
        </div>
        {unitError && <div style={{ color: 'red', marginTop: 8 }}>{unitError}</div>}
        {unitSuccess && <div style={{ color: 'green', marginTop: 8 }}>{unitSuccess}</div>}
        <button type="submit" style={{ marginTop: 12 }}>Create Unit</button>
      </form>

      <h4>Existing Units</h4>
      {units.length === 0 ? (
        <p>No units yet.</p>
      ) : (
        <ul>
          {units.map(unit => (
            <li key={unit.id}>
              <b>{unit.title}</b> (Unit {unit.number}){unit.description ? `: ${unit.description}` : ''}
            </li>
          ))}
        </ul>
      )}

      <h3>Create Question</h3>
      <form onSubmit={handleSubmit} style={{ background: '#fff', padding: 16, borderRadius: 8, marginBottom: 24 }}>
        <div>
          <label>Type:</label>
          <select value={questionType} onChange={e => {
            setQuestionType(e.target.value);
            setForm({ content: '', options: e.target.value === 'multiple_choice' ? ['', ''] : '', answer: '', scoring: '', feedback: '' });
          }}>
            <option value="multiple_choice">Multiple Choice</option>
            <option value="drag_and_drop">Drag and Drop</option>
            <option value="sortable">Sortable</option>
            <option value="matching">Matching</option>
          </select>
        </div>
        <div>
          <label>Unit:</label>
          <select value={selectedUnit} onChange={e => setSelectedUnit(e.target.value)} required>
            {units.map(unit => (
              <option key={unit.id} value={unit.id}>{unit.title} (Unit {unit.number})</option>
            ))}
          </select>
        </div>
        <div>
          <label>Question:</label>
          <textarea name="content" value={form.content} onChange={handleFormChange} required rows={2} style={{ width: '100%' }} />
        </div>
        {questionType === 'multiple_choice' && Array.isArray(form.options) && (
          <div>
            <label>Options:</label>
            {form.options && Array.isArray(form.options) ? form.options.map((opt, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                <input
                  name="options"
                  value={opt}
                  onChange={e => handleFormChange(e, idx)}
                  required
                  style={{ flex: 1 }}
                />
                {form.options.length > 2 && (
                  <button type="button" onClick={() => removeOption(idx)} style={{ marginLeft: 8 }}>Remove</button>
                )}
              </div>
            )) : null}
            <button type="button" onClick={addOption} style={{ marginTop: 4 }}>Add Option</button>
          </div>
        )}
        {(questionType === 'drag_and_drop' || questionType === 'sortable') && (
          <div>
            <label>Options (JSON):</label>
            <textarea
              name="options"
              value={typeof form.options === 'string' ? form.options : ''}
              onChange={e => setForm({ ...form, options: e.target.value })}
              required
              rows={3}
              style={{ width: '100%', fontFamily: 'monospace' }}
              placeholder='{"items": ["fox", "quick", "the", "brown"], "correctOrder": [2,3,1,0]}'
            />
          </div>
        )}
        {questionType === 'matching' && (
          <div>
            <label>Options (JSON):</label>
            <textarea
              name="options"
              value={typeof form.options === 'string' ? form.options : ''}
              onChange={e => setForm({ ...form, options: e.target.value })}
              required
              rows={3}
              style={{ width: '100%', fontFamily: 'monospace' }}
              placeholder='{"left": ["cat", "dog"], "right": ["🐱", "🐶"], "pairs": [[0,0],[1,1]]}'
            />
          </div>
        )}
        {questionType === 'multiple_choice' && (
          <div>
            <label>Answer:</label>
            <input
              name="answer"
              value={form.answer}
              onChange={handleFormChange}
              required
              placeholder="Must match one of the options"
              style={{ width: '100%' }}
            />
          </div>
        )}
        {(questionType === 'drag_and_drop' || questionType === 'sortable') && (
          <div>
            <label>Answer (optional):</label>
            <input
              name="answer"
              value={form.answer}
              onChange={handleFormChange}
              placeholder="(Optional)"
              style={{ width: '100%' }}
            />
          </div>
        )}
        <div>
          <label>Scoring (JSON, optional):</label>
          <textarea
            name="scoring"
            value={form.scoring}
            onChange={e => setForm({ ...form, scoring: e.target.value })}
            rows={2}
            style={{ width: '100%', fontFamily: 'monospace' }}
            placeholder='{"points": 1, "partial": false}'
          />
        </div>
        <div>
          <label>Feedback (JSON, optional):</label>
          <textarea
            name="feedback"
            value={form.feedback}
            onChange={e => setForm({ ...form, feedback: e.target.value })}
            rows={2}
            style={{ width: '100%', fontFamily: 'monospace' }}
            placeholder='{"correct": "Well done!", "incorrect": "Try again."}'
          />
        </div>
        {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
        {success && <div style={{ color: 'green', marginTop: 8 }}>{success}</div>}
        <button type="submit" style={{ marginTop: 12 }}>Create Question</button>
      </form>

      <h3>Bulk Import Questions (Paste JSON)</h3>
      <form onSubmit={handleBulkImport} style={{ background: '#f8f8f8', padding: 16, borderRadius: 8, marginBottom: 24 }}>
        <textarea
          value={bulkJson}
          onChange={e => setBulkJson(e.target.value)}
          rows={8}
          style={{ width: '100%', fontFamily: 'monospace' }}
          placeholder={`Paste an array of questions, e.g.\n[
  {"content": "What is 2+2?", "type": "multiple_choice", "options": ["3", "4", "5"], "answer": "4", "unitId": "..."},
  {"content": "Arrange the words.", "type": "drag_and_drop", "options": {"items": ["fox", "quick", "the", "brown"], "correctOrder": [2,3,1,0]}, "unitId": "..."},
  {"content": "Match the animal.", "type": "matching", "options": {"left": ["cat", "dog"], "right": ["🐱", "🐶"], "pairs": [[0,0],[1,1]]}, "unitId": "..."}
]`}
          required
        />
        <button type="submit" style={{ marginTop: 8 }} disabled={bulkLoading}>
          {bulkLoading ? 'Importing...' : 'Import Questions'}
        </button>
        {bulkError && <div style={{ color: 'red', marginTop: 8 }}>{bulkError}</div>}
      </form>
      {bulkResult && (
        <div style={{ background: '#fff', padding: 12, borderRadius: 8, marginBottom: 24 }}>
          <h4>Import Results</h4>
          <ul>
            {bulkResult.map((r, i) => (
              <li key={i} style={{ color: r.status === 'success' ? 'green' : 'red' }}>
                {r.status === 'success'
                  ? `Success: ${r.question.content}`
                  : `Error (index ${r.index}): ${r.error}`}
              </li>
            ))}
          </ul>
        </div>
      )}

      <h3>Questions for Selected Unit</h3>
      {questions.length === 0 ? (
        <p>No questions yet.</p>
      ) : (
        <ul>
          {questions.map(q => (
            <li key={q.id} style={{ marginBottom: 12 }}>
              {editId === q.id ? (
                <form onSubmit={async e => {
                  e.preventDefault();
                  setEditError('');
                  setEditSuccess('');
                  try {
                    await axios.patch(`/questions/${q.id}`, editForm);
                    setEditSuccess('Question updated!');
                    setEditId(null);
                    const res = await axios.get('/questions', { params: { unitId: selectedUnit } });
                    setQuestions(res.data.questions);
                  } catch (err: any) {
                    setEditError(err.response?.data?.message || 'Failed to update question');
                  }
                }} style={{ background: '#f0f0f0', padding: 8, borderRadius: 6 }}>
                  <input value={editForm.content} onChange={e => setEditForm({ ...editForm, content: e.target.value })} style={{ width: '100%' }} />
                  {/* Add fields for options, answer, type, scoring, feedback as needed */}
                  <button type="submit">Save</button>
                  <button type="button" onClick={() => setEditId(null)}>Cancel</button>
                  {editError && <div style={{ color: 'red' }}>{editError}</div>}
                  {editSuccess && <div style={{ color: 'green' }}>{editSuccess}</div>}
                </form>
              ) : (
                <>
                  <strong>{q.content}</strong>
                  <button onClick={() => { setEditId(q.id); setEditForm(q); }}>Edit</button>
                  <button onClick={async () => {
                    if (window.confirm('Delete this question?')) {
                      await axios.delete(`/questions/${q.id}`);
                      setQuestions(questions.filter(qq => qq.id !== q.id));
                    }
                  }}>Delete</button>
                </>
              )}
              <ul>
                {q.options.map((opt, i) => (
                  <li key={i} style={{ color: opt === q.answer ? 'green' : undefined }}>
                    {opt} {opt === q.answer && <b>(Correct)</b>}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Teacher; 