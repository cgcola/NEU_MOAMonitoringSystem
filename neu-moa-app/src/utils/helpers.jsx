// 1. Smart Name Formatter 
export const formatName = (rawName) => {
  if (!rawName) return '';
  const properCase = (str) => str.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
  let formattedName = rawName;
  if (rawName.includes(',')) {
    const parts = rawName.split(',');
    const lastName = parts[0].trim();
    const firstAndMiddle = parts.slice(1).join(' ').trim();
    formattedName = `${firstAndMiddle} ${lastName}`;
  }
  return properCase(formattedName);
};

// 2. Reusable Status Badge
export const renderBadge = (statusStr) => {
  if (!statusStr) return null;
  const isApproved = statusStr.toUpperCase().includes('APPROVED');
  const isExpired = statusStr.toUpperCase().includes('EXPIRED');
  const isProcessing = statusStr.toUpperCase().includes('PROCESSING');
  
  let bg = '#f8f9fa', color = '#333', border = '#eee';
  if (isApproved) { bg = '#e6f4ea'; color = '#1e8e3e'; border = '#cce8d6'; }
  if (isProcessing) { bg = '#e6f0fa'; color = '#0d6efd'; border = '#cce5ff'; }
  if (isExpired) { bg = '#fce8e6'; color = '#d93025'; border = '#f9c2c4'; }

  let text1 = statusStr;
  let text2 = '';
  
  if (statusStr.includes(':')) {
    text1 = statusStr.split(':')[0];
    text2 = statusStr.split(':')[1].trim();
  } else if (statusStr.includes('-')) {
    text1 = statusStr.split('-')[0].trim();
    text2 = statusStr.slice(statusStr.indexOf('-') + 1).trim();
  }

  if (text1.toLowerCase() === 'approved') text1 = 'Approved';
  if (text1.toLowerCase() === 'processing') text1 = 'Processing';
  if (text1.toLowerCase() === 'expired') text1 = 'Expired';
  if (text1.toLowerCase() === 'expiring') text1 = 'Expiring';

  return (
    <span style={{ 
      display: 'inline-block', 
      background: bg, 
      color: color, 
      border: `1px solid ${border}`, 
      padding: '6px 12px', 
      borderRadius: '20px', 
      fontSize: '0.75rem', 
      fontWeight: '600', 
      textAlign: 'center', 
      lineHeight: '1.4', 
      whiteSpace: 'normal',       // FIXED: Allows wrapping
      wordBreak: 'break-word',    // FIXED: Prevents overflowing containers
      maxWidth: '100%' 
    }}>
      {text1} {text2 && <><br/><span style={{ fontWeight: '500' }}>- {text2}</span></>}
    </span>
  );
};

// 3. Audit Trail Renderer
export const renderAuditDetails = (log) => {
  if (log.operation === 'INSERT') return <span>Initial creation</span>;
  if (log.operation === 'DELETE') return <span style={{ color: '#dc3545' }}>Moved record to trash</span>;
  if (log.operation === 'RECOVER') return <span style={{ color: '#1e8e3e' }}>Restored record</span>;

  if (log.changes && typeof log.changes === 'object' && Object.keys(log.changes).length > 0) {
    const hiddenFields = ['updated_at', 'created_at', 'id'];
    const changes = Object.entries(log.changes).filter(([field]) => !hiddenFields.includes(field));

    if (changes.length === 0) return <span>Updated record details</span>;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {changes.map(([field, val]) => (
          <span key={field}>
            Updated {field.replace(/_/g, ' ')} to <span style={{ color: '#333' }}>{String(val)}</span>
          </span>
        ))}
      </div>
    );
  }
  return <span>Updated record details</span>;
};