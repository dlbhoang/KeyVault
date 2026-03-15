import React from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, Zap, Users, Key, Calculator, HardHat } from 'lucide-react'

export default function Landing({ onAdminLogin, onUserLogin, onUserRegister }) {

  const features = [
    {
      icon:<Calculator size={20}/>,
      title:'Tính toán xây dựng',
      desc:'Công cụ tính toán kết cấu, vật liệu và khối lượng nhanh chóng',
      color:'var(--indigo)'
    },
    {
      icon:<Zap size={20}/>,
      title:'Tính toán tức thì',
      desc:'Kết quả ngay lập tức giúp kỹ sư tiết kiệm thời gian',
      color:'var(--amber)'
    },
    {
      icon:<ShieldCheck size={20}/>,
      title:'License an toàn',
      desc:'Kích hoạt bằng key bản quyền, bảo mật và ổn định',
      color:'var(--emerald)'
    },
    {
      icon:<HardHat size={20}/>,
      title:'Dành cho kỹ sư',
      desc:'Thiết kế tối ưu cho kỹ sư xây dựng và thiết kế công trình',
      color:'var(--sky)'
    },
  ]

  return (
    <div style={{ minHeight:'100vh', background:'var(--g-mesh)', display:'flex', flexDirection:'column' }}>

      {/* NAV */}
      <nav style={{
        padding:'18px 48px',
        display:'flex',
        alignItems:'center',
        justifyContent:'space-between',
        background:'rgba(255,255,255,.7)',
        backdropFilter:'blur(20px)',
        borderBottom:'1.5px solid var(--b1)',
        position:'sticky',
        top:0,
        zIndex:50
      }}>
        <motion.div initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}}
          style={{ display:'flex', alignItems:'center', gap:10 }}>

          <div style={{
            width:36,
            height:36,
            borderRadius:10,
            background:'var(--g-brand)',
            display:'flex',
            alignItems:'center',
            justifyContent:'center',
            fontSize:18,
            boxShadow:'var(--s-indigo)'
          }}>
            🏗️
          </div>

          <span style={{ fontWeight:800, fontSize:18, color:'var(--t1)' }}>
            Build<span style={{ color:'var(--indigo)' }}>Calc</span>
          </span>

        </motion.div>

        <motion.div initial={{opacity:0,x:20}} animate={{opacity:1,x:0}}
          style={{ display:'flex', gap:10 }}>

          <motion.button
            whileHover={{scale:1.03}}
            whileTap={{scale:.97}}
            onClick={onUserLogin}
            style={{
              padding:'8px 20px',
              borderRadius:9,
              border:'1.5px solid var(--b2)',
              background:'white',
              color:'var(--t1)',
              fontWeight:600,
              fontSize:13,
              cursor:'pointer'
            }}>
            Đăng nhập
          </motion.button>

          <motion.button
            whileHover={{scale:1.03,y:-1}}
            whileTap={{scale:.97}}
            onClick={onAdminLogin}
            style={{
              padding:'8px 20px',
              borderRadius:9,
              border:'none',
              background:'var(--g-brand)',
              color:'white',
              fontWeight:600,
              fontSize:13,
              cursor:'pointer',
              boxShadow:'var(--s-indigo)'
            }}>
            Admin
          </motion.button>

        </motion.div>
      </nav>

      {/* HERO */}
      <div style={{
        flex:1,
        display:'flex',
        flexDirection:'column',
        alignItems:'center',
        justifyContent:'center',
        padding:'60px 24px',
        textAlign:'center'
      }}>

        <motion.div
          initial={{scale:0,rotate:-30}}
          animate={{scale:1,rotate:0}}
          transition={{type:'spring',damping:14,stiffness:180,delay:.1}}
          style={{
            width:88,
            height:88,
            borderRadius:26,
            background:'var(--g-brand)',
            display:'flex',
            alignItems:'center',
            justifyContent:'center',
            fontSize:38,
            boxShadow:'var(--s-indigo)',
            marginBottom:28
          }}>
          🏗️
        </motion.div>

        <motion.h1
          initial={{opacity:0,y:20}}
          animate={{opacity:1,y:0}}
          transition={{delay:.2}}
          style={{
            fontWeight:800,
            fontSize:'clamp(36px,6vw,60px)',
            lineHeight:1.1,
            marginBottom:18,
            maxWidth:720,
            color:'var(--t1)'
          }}>
          Phần mềm tính toán{' '}
          <span style={{
            background:'var(--g-brand)',
            WebkitBackgroundClip:'text',
            WebkitTextFillColor:'transparent'
          }}>
            xây dựng chuyên nghiệp
          </span>
        </motion.h1>

        <motion.p
          initial={{opacity:0,y:16}}
          animate={{opacity:1,y:0}}
          transition={{delay:.28}}
          style={{
            fontSize:18,
            color:'var(--t2)',
            maxWidth:540,
            marginBottom:40,
            lineHeight:1.7
          }}>
          Công cụ hỗ trợ kỹ sư xây dựng tính toán nhanh chóng các thông số kỹ thuật,
          quản lý dự án và tối ưu thiết kế công trình.
        </motion.p>

        <motion.div
          initial={{opacity:0,y:12}}
          animate={{opacity:1,y:0}}
          transition={{delay:.36}}
          style={{ display:'flex', gap:12, flexWrap:'wrap', justifyContent:'center' }}
        >

          <motion.button
            whileHover={{scale:1.04,y:-2}}
            whileTap={{scale:.97}}
            onClick={onUserRegister}
            style={{
              padding:'14px 32px',
              borderRadius:12,
              border:'none',
              background:'var(--g-brand)',
              color:'white',
              fontWeight:700,
              fontSize:16,
              cursor:'pointer',
              boxShadow:'var(--s-indigo)'
            }}>
            🚀 Đăng ký nhận key
          </motion.button>

          <motion.button
            whileHover={{scale:1.04,y:-2}}
            whileTap={{scale:.97}}
            onClick={onUserLogin}
            style={{
              padding:'14px 32px',
              borderRadius:12,
              border:'1.5px solid var(--b2)',
              background:'white',
              color:'var(--t1)',
              fontWeight:700,
              fontSize:16,
              cursor:'pointer',
              boxShadow:'var(--s2)'
            }}>
            🔑 Kích hoạt License
          </motion.button>

        </motion.div>

        {/* FEATURES */}
        <motion.div
          initial={{opacity:0,y:30}}
          animate={{opacity:1,y:0}}
          transition={{delay:.5}}
          style={{
            display:'grid',
            gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',
            gap:16,
            maxWidth:860,
            width:'100%',
            marginTop:70
          }}>

          {features.map((f,i) => (
            <motion.div
              key={f.title}
              initial={{opacity:0,y:20}}
              animate={{opacity:1,y:0}}
              transition={{delay:.55+i*.07}}
              whileHover={{y:-4,boxShadow:'var(--s3)'}}
              style={{
                background:'white',
                border:'1.5px solid var(--b1)',
                borderRadius:16,
                padding:'22px 20px',
                textAlign:'left',
                boxShadow:'var(--s2)'
              }}>

              <div style={{
                width:44,
                height:44,
                borderRadius:12,
                background:`${f.color}14`,
                display:'flex',
                alignItems:'center',
                justifyContent:'center',
                color:f.color,
                marginBottom:14
              }}>
                {f.icon}
              </div>

              <div style={{
                fontWeight:700,
                fontSize:15,
                marginBottom:6,
                color:'var(--t1)'
              }}>
                {f.title}
              </div>

              <div style={{
                fontSize:13,
                color:'var(--t3)',
                lineHeight:1.6
              }}>
                {f.desc}
              </div>

            </motion.div>
          ))}

        </motion.div>

      </div>

      <footer style={{
        textAlign:'center',
        padding:'20px',
        fontSize:12,
        color:'var(--t3)',
        borderTop:'1.5px solid var(--b1)',
        background:'rgba(255,255,255,.5)'
      }}>
        © 2026 BuildCalc Software · Engineering Tools
      </footer>

    </div>
  )
}