import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { setDocData, deleteDocData, changePassword, deleteAccount, updateDisplayName } from '../utils/firebaseClient';
import { translateAuthError } from '../utils/authErrors';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const COUNTRIES = [
  'Afghanistan','Albania','Algeria','Andorra','Angola','Antigua and Barbuda','Argentina','Armenia','Australia','Austria','Azerbaijan',
  'Bahamas','Bahrain','Bangladesh','Barbados','Belarus','Belgium','Belize','Benin','Bhutan','Bolivia','Bosnia and Herzegovina','Botswana','Brazil','Brunei','Bulgaria','Burkina Faso','Burundi',
  'Cabo Verde','Cambodia','Cameroon','Canada','Central African Republic','Chad','Chile','China','Colombia','Comoros','Congo (Congo-Brazzaville)','Costa Rica','Côte d’Ivoire','Croatia','Cuba','Cyprus','Czech Republic',
  'Democratic Republic of the Congo','Denmark','Djibouti','Dominica','Dominican Republic','Ecuador','Egypt','El Salvador','Equatorial Guinea','Eritrea','Estonia','Eswatini','Ethiopia',
  'Fiji','Finland','France','Gabon','Gambia','Georgia','Germany','Ghana','Greece','Grenada','Guatemala','Guinea','Guinea-Bissau','Guyana',
  'Haiti','Honduras','Hungary','Iceland','India','Indonesia','Iran','Iraq','Ireland','Israel','Italy','Jamaica','Japan','Jordan',
  'Kazakhstan','Kenya','Kiribati','Kuwait','Kyrgyzstan','Laos','Latvia','Lebanon','Lesotho','Liberia','Libya','Liechtenstein','Lithuania','Luxembourg',
  'Madagascar','Malawi','Malaysia','Maldives','Mali','Malta','Marshall Islands','Mauritania','Mauritius','Mexico','Micronesia','Moldova','Monaco','Mongolia','Montenegro','Morocco','Mozambique','Myanmar',
  'Namibia','Nauru','Nepal','Netherlands','New Zealand','Nicaragua','Niger','Nigeria','North Korea','North Macedonia','Norway','Oman','Pakistan','Palau','Panama','Papua New Guinea','Paraguay','Peru','Philippines','Poland','Portugal',
  'Qatar','Romania','Russia','Rwanda','Saint Kitts and Nevis','Saint Lucia','Saint Vincent and the Grenadines','Samoa','San Marino','Sao Tome and Principe','Saudi Arabia','Senegal','Serbia','Seychelles','Sierra Leone','Singapore','Slovakia','Slovenia','Solomon Islands','Somalia','South Africa','South Korea','South Sudan','Spain','Sri Lanka','Sudan','Suriname','Sweden','Switzerland','Syria',
  'Taiwan','Tajikistan','Tanzania','Thailand','Timor-Leste','Togo','Tonga','Trinidad and Tobago','Tunisia','Turkey','Turkmenistan','Tuvalu','Uganda','Ukraine','United Arab Emirates','United Kingdom','United States','Uruguay','Uzbekistan','Vanuatu','Vatican City','Venezuela','Vietnam','Yemen','Zambia','Zimbabwe'
];

export default function ProfilePage() {
  useDocumentTitle('Mi perfil');
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [name, setName] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [country, setCountry] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [status, setStatus] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- populate the form once Firebase auth resolves
    setName(user.name || '');
    setBirthdate(user.birthdate || '');
    setPhone(user.phone || '');
    setGender(user.gender || '');
    setCountry(user.country || '');
  }, [user]);

  async function handleSave(e) {
    e.preventDefault();
    if (password && password !== confirm) {
      setStatus({ ok: false, msg: 'Las contraseñas no coinciden' });
      return;
    }
    setIsSaving(true);
    setStatus(null);
    try {
      await setDocData('users', user.uid, {
        name: name.trim(),
        birthdate: birthdate || null,
        phone: phone.trim() || null,
        gender: gender || null,
        country: country || null,
      });
      if (name.trim() && name.trim() !== user.name) {
        try { await updateDisplayName(name.trim()); } catch { /* non-critical */ }
      }
      if (password.trim()) {
        await changePassword(password);
      }
      setPassword('');
      setConfirm('');
      setStatus({ ok: true, msg: 'Perfil actualizado' });
    } catch (err) {
      setStatus({ ok: false, msg: translateAuthError(err) });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm('¿Eliminar tu cuenta? Esta acción no se puede deshacer.')) return;
    try {
      await deleteAccount();
      await deleteDocData('users', user.uid).catch(() => {});
      navigate('/');
    } catch (err) {
      setStatus({ ok: false, msg: translateAuthError(err) });
    }
  }

  if (loading || !user) return null;

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Mi perfil</h2>
      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <label className="flex flex-col">
          <span className="text-sm text-ink-faint">Nombre</span>
          <input value={name} onChange={e => setName(e.target.value)} className="input" />
        </label>

        <label className="flex flex-col">
          <span className="text-sm text-ink-faint">Correo (no editable)</span>
          <input value={user.email} readOnly className="input bg-gray-50 dark:bg-gray-800" />
        </label>

        <label className="flex flex-col">
          <span className="text-sm text-ink-faint">Fecha de nacimiento</span>
          <input type="date" value={birthdate} onChange={e => setBirthdate(e.target.value)} className="input" />
        </label>

        <label className="flex flex-col">
          <span className="text-sm text-ink-faint">Número de teléfono</span>
          <input value={phone} onChange={e => setPhone(e.target.value)} className="input" placeholder="+34 600 000 000" />
        </label>

        <label className="flex flex-col">
          <span className="text-sm text-ink-faint">Sexo</span>
          <select value={gender} onChange={e => setGender(e.target.value)} className="input">
            <option value="">-- Seleccionar --</option>
            <option value="female">Femenino</option>
            <option value="male">Masculino</option>
            <option value="other">Otro</option>
            <option value="prefer_not">Prefiero no decir</option>
          </select>
        </label>

        <label className="flex flex-col">
          <span className="text-sm text-ink-faint">País de residencia</span>
          <select value={country} onChange={e => setCountry(e.target.value)} className="input">
            <option value="">-- Seleccionar país --</option>
            {COUNTRIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col relative">
          <span className="text-sm text-ink-faint">Nueva contraseña (dejar vacío para mantener)</span>
          <div className="relative">
            <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="input pr-10" />
            <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-faint">
              {showPassword ? (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-3.582-10-8 1-4.418 5-8 10-8 1.647 0 3.21.345 4.625.975"/></svg>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
              )}
            </button>
          </div>
        </label>

        <label className="flex flex-col relative">
          <span className="text-sm text-ink-faint">Confirmar contraseña</span>
          <div className="relative">
            <input type={showConfirm ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)} className="input pr-10" />
            <button type="button" onClick={() => setShowConfirm(s => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-faint">
              {showConfirm ? (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-3.582-10-8 1-4.418 5-8 10-8 1.647 0 3.21.345 4.625.975"/></svg>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
              )}
            </button>
          </div>
        </label>

        <div className="flex items-center gap-4">
          <button className="btn-primary" type="submit" disabled={isSaving}>{isSaving ? 'Guardando...' : 'Guardar'}</button>
          <button type="button" className="btn-ghost text-red-600" onClick={handleDelete}>Eliminar cuenta</button>
        </div>

        {status && (
          <div className={status.ok ? 'text-green-600' : 'text-red-600'}>{status.msg}</div>
        )}
      </form>
    </div>
  );
}
