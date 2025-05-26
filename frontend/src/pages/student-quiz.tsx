import React, { useEffect, useState } from 'react';
import axios from '../api';

interface Unit {
  id: string;
  number: number;
  title: string;
}

interface Question {
  id: string;
  content: string;
  type: string;
  options: any;
  answer: string;
  createdAt: string;
}

const StudentQuiz: React.FC = () => {
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<string>('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<{ [qid: string]: any }>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const res = await axios.get('/units');
        setUnits(res.data.units);
        if (res.data.units.length > 0) {
          setSelectedUnit(res.data.units[0].id);
        }
      } catch {}
    };
    fetchUnits();
  }, []);

  useEffect(() => {
    if (!selectedUnit) return;
    const fetchQuestions = async () => {
      try {
        const res = await axios.get('/questions', { params: { unitId: selectedUnit } });
        setQuestions(res.data.questions);
      } catch {
        setQuestions([]);
      }
    };
    fetchQuestions();
  }, [selectedUnit]);

  const handleChange = (qid: string, value: any) => {
    setAnswers({ ...answers, [qid]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div style={{ maxWidth: 700, margin: 'auto', padding: 20 }}>
      <h2>Student Quiz</h2>
      <div>
        <label>Unit:</label>
        <select value={selectedUnit} onChange={e => setSelectedUnit(e.target.value)}>
          {units.map(unit => (
            <option key={unit.id} value={unit.id}>{unit.title} (Unit {unit.number})</option>
          ))}
        </select>
      </div>
      <form onSubmit={handleSubmit}>
        {questions.length === 0 ? (
          <p>No questions for this unit.</p>
        ) : (
          <div>
            {questions.map(q => (
              <div key={q.id} style={{ marginBottom: 24, padding: 12, background: '#f8f8f8', borderRadius: 8 }}>
                <div><b>{q.content}</b></div>
                {q.type === 'multiple_choice' && Array.isArray(q.options) && (
                  <div>
                    {q.options.map((opt: string, i: number) => (
                      <label key={i} style={{ display: 'block' }}>
                        <input
                          type="radio"
                          name={q.id}
                          value={opt}
                          checked={answers[q.id] === opt}
                          onChange={() => handleChange(q.id, opt)}
                        />{' '}
                        {opt}
                      </label>
                    ))}
                  </div>
                )}
                {(q.type === 'drag_and_drop' || q.type === 'sortable') && q.options && Array.isArray(q.options.items) && (
                  <div>
                    <label>Order (comma separated indices):</label>
                    <input
                      type="text"
                      value={answers[q.id] || ''}
                      onChange={e => handleChange(q.id, e.target.value)}
                      placeholder={`e.g. 0,1,2,3 for original order`}
                      style={{ width: '100%' }}
                    />
                    <div style={{ fontSize: 12, color: '#888' }}>
                      Items: {q.options.items.join(', ')}
                    </div>
                  </div>
                )}
                {q.type === 'matching' && q.options && Array.isArray(q.options.left) && Array.isArray(q.options.right) && (
                  <div>
                    {q.options.left.map((left: string, i: number) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ minWidth: 80 }}>{left}</span>
                        <select
                          value={answers[q.id]?.[i] || ''}
                          onChange={e => {
                            const arr = answers[q.id] ? [...answers[q.id]] : Array(q.options.left.length).fill('');
                            arr[i] = e.target.value;
                            handleChange(q.id, arr);
                          }}
                        >
                          <option value="">Select</option>
                          {q.options.right.map((right: string, j: number) => (
                            <option key={j} value={j}>{right}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <button type="submit">Submit Answers</button>
          </div>
        )}
      </form>
      {submitted && (
        <div style={{ marginTop: 24 }}>
          <h3>Your Answers</h3>
          <pre>{JSON.stringify(answers, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default StudentQuiz; 