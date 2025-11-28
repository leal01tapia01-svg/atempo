import React from "react";
import "../styles/planes.css";
import { FaCheck, FaStar, FaFeather, FaLayerGroup, FaSitemap } from "react-icons/fa";
import logo from "../assets/LogoAtempoPNG.png";

const Planes = () => {
    return (
        <div className="planes-container">
            <div className="planes-header">
                <img src={logo} alt="Atempo logo" className="planes-logo" />
                <h1 className="planes-title">Atempo</h1>
                <h2 className="planes-subtitle">Planes y precios</h2>
                <p className="planes-helper">
                    Elige el plan que mejor se ajuste a tu operación. Puedes cambiarlo más adelante.
                </p>
            </div>

            <div className="planes-grid">
                <article className="plan-card">
                    <div className="plan-head">
                        <div className="plan-icon plan-icon--free" aria-hidden="true">
                            <FaFeather />
                        </div>
                        <h3 className="plan-name">Plan Gratis</h3>
                        <p className="plan-tagline">Para empezar sencillo y sin fricción.</p>

                        <div className="plan-price">
                            <span className="price-currency">MXN</span>
                            <span className="price-amount">$0</span>
                            <span className="price-period">/mes</span>
                        </div>
                        <div className="price-tax">IVA incl.</div>
                    </div>

                    <ul className="plan-features">
                        <li><FaCheck className="check" /> 3 empleados</li>
                        <li><FaCheck className="check" /> Recordatorios por email básicos (hasta 50/mes)</li>
                        <li><FaCheck className="check" /> Gestión de clientes frecuentes (básico) y notas en cita</li>
                        <li><FaCheck className="check" /> Soporte estándar por email</li>
                    </ul>

                    <button className="plan-cta">Elegir plan</button>
                </article>

                <article className="plan-card plan-popular" aria-label="Plan Popular">
                    <div className="plan-ribbon">
                        <FaStar className="ribbon-icon" />
                        Más elegido
                    </div>
                    <div className="plan-head">
                        <div className="plan-icon plan-icon--popular" aria-hidden="true">
                            <FaLayerGroup />
                        </div>
                        <h3 className="plan-name">Plan +Popular</h3>
                        <p className="plan-tagline">
                            Para profesionales/negocios con más flujo y equipo.
                        </p>

                        <div className="plan-price">
                            <span className="price-currency">MXN</span>
                            <span className="price-amount">$99</span>
                            <span className="price-period">/mes</span>
                        </div>
                        <div className="price-tax">IVA incl.</div>
                    </div>

                    <p className="plan-includes">Todo lo del Plan Gratis, más:</p>
                    <ul className="plan-features">
                        <li><FaCheck className="check" /> Hasta 8 empleados</li>
                        <li><FaCheck className="check" /> Recordatorios por email ilimitados</li>
                        <li><FaCheck className="check" /> Confirmación del cliente en 1 clic (desde correo)</li>
                        <li><FaCheck className="check" /> Recordatorios por WhatsApp: hasta 300/mes (opt-in del cliente)</li>
                        <li><FaCheck className="check" /> Branding en correos (logo + nombre del negocio)</li>
                        <li><FaCheck className="check" /> Soporte con prioridad media</li>
                    </ul>

                    <button className="plan-cta">Elegir plan</button>
                </article>

                <article className="plan-card">
                    <div className="plan-head">
                        <div className="plan-icon plan-icon--pro" aria-hidden="true">
                            <FaSitemap />
                        </div>
                        <h3 className="plan-name">Plan Pro</h3>
                        <p className="plan-tagline">Para operaciones avanzadas o multi-sede.</p>

                        <div className="plan-price">
                            <span className="price-currency">MXN</span>
                            <span className="price-amount">$249</span>
                            <span className="price-period">/mes</span>
                        </div>
                        <div className="price-tax">IVA incl.</div>
                    </div>

                    <p className="plan-includes">Todo lo del Plan +Popular, más:</p>
                    <ul className="plan-features">
                        <li><FaCheck className="check" /> Empleados ilimitados y hasta 3 sucursales</li>
                        <li><FaCheck className="check" /> Roles y permisos</li>
                        <li><FaCheck className="check" /> WhatsApp ampliado: hasta 2,000/mes + confirmación por WhatsApp (respuestas rápidas “Sí/No”)</li>
                        <li><FaCheck className="check" /> Soporte prioritario</li>
                    </ul>

                    <button className="plan-cta">Elegir plan</button>
                </article>
            </div>
        </div>
    );
};

export default Planes;
