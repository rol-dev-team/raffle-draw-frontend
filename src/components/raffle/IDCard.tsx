import React from 'react';
import { IdCard, Layers, Building2, MapPin, Users, User } from 'lucide-react';

const IDCard = ({
  name = 'YOUR NAME',
  designation = 'Graphic Designer',
  regNo = 'REG-0000',
  department = 'Department',
  company = 'Company Name',
  branch = 'Branch',
  ticket = 'Ticket',
}) => {
  return (
    <div style={styles.wrapper}>
      {/* Avatar */}
      <div style={styles.avatarWrap}>
        <div style={styles.avatar}>
          <User size={64} color="#cbd5e1" />
        </div>
      </div>

      {/* Name Section */}
      <div style={styles.nameSection}>
        <h2 style={styles.name}>{name}</h2>
        <p style={styles.designation}>{designation}</p>
        <div style={styles.line} />
        <p style={styles.ticketNo}>{`Ticket: ${ticket}`}</p>
      </div>

      {/* Info Capsule */}
      <div style={styles.infoCapsule}>
        <Info icon={<IdCard size={16} />} text={`${regNo}`} />
        <Info icon={<Layers size={16} />} text={`${department}`} />
        <Info icon={<Building2 size={16} />} text={`${company}`} />
        <Info icon={<MapPin size={16} />} text={`${branch}`} />
        {/* <Info
          icon={<Users size={16} />}
          text={`${gender}`}
        /> */}
        {/* <Info
          icon={<IdCard size={16} />}
          text={`${ticket}`}
        /> */}
      </div>
    </div>
  );
};

const Info = ({ icon, text }) => (
  <div style={styles.infoRow}>
    <span style={styles.icon}>{icon}</span>
    <span style={styles.infoText}>{text}</span>
  </div>
);

/* styles EXACTLY same – unchanged */
const styles = {
  wrapper: {
    display: 'flex',
    alignItems: 'center',
    width: '900px',
    // height: "220px",
    height: '280px',
    background: '#042f3c',
    borderRadius: '14px',
    overflow: 'hidden',
    fontFamily: 'Inter, sans-serif',
  },

  avatarWrap: {
    padding: '30px',
  },

  avatar: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    background: '#5b7682',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  nameSection: {
    color: '#ffffff',
    minWidth: '260px',
  },

  name: {
    margin: 0,
    fontSize: '32px',
    fontWeight: 'bold',
    letterSpacing: '1px',
    color: '#63ce1e',
  },

  designation: {
    marginTop: '6px',
    fontSize: '18px',
    fontWeight: 'bold',
    opacity: 0.85,
  },
  ticketNo: {
    marginTop: '6px',
    fontSize: '25px',
    fontWeight: 'bold',
    opacity: 0.85,
  },

  line: {
    marginTop: '12px',
    width: '50px',
    height: '2px',
    background: '#63ce1e',
  },

  infoCapsule: {
    marginLeft: 'auto',
    background: '#63ce1e',
    height: '100%',
    width: '360px',
    borderTopLeftRadius: '120px',
    borderBottomLeftRadius: '120px',
    padding: '40px 35px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: '14px',
  },

  infoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    color: '#063b2a',
    fontSize: '14px',
    fontWeight: 500,
  },

  icon: {
    background: 'rgba(255,255,255,0.4)',
    padding: '6px',
    borderRadius: '50%',
  },

  infoText: {
    whiteSpace: 'nowrap',
    fontWeight: 'bold',
  },
};

export default IDCard;
