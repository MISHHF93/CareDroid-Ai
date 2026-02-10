import { useState } from 'react';
import ToolPageLayout from './ToolPageLayout';
import { apiFetch } from '../../services/apiClient';
import { useLanguage } from '../../contexts/LanguageContext';

const SearchableToolPage = ({
  toolConfig,
  commonItems,
  placeholder,
  searchPrompt,
  errorMessage
}) => {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (itemName = query) => {
    if (!itemName.trim()) return;

    setLoading(true);
    try {
      const response = await apiFetch('/api/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('caredroid_access_token')}`,
        },
        body: JSON.stringify({
          message: `${searchPrompt}: ${itemName}`,
          tool: toolConfig.id
        }),
      });

      const data = await response.json();
      setResults(data.response);
    } catch (err) {
      setResults(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ToolPageLayout tool={toolConfig} results={results}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px' }}>
        <div style={{ marginBottom: '24px' }}>
          <input
            type="text"
            style={{
              width: '100%',
              padding: '14px 16px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '10px',
              color: 'var(--text-primary)',
              fontSize: '16px',
            }}
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '32px' }}>
          {commonItems.map(item => (
            <button
              key={item}
              style={{
                padding: '12px 16px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onClick={() => { setQuery(item); handleSearch(item); }}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </ToolPageLayout>
  );
};

export default SearchableToolPage;