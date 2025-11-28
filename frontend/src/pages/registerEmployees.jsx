import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/registerEmployees.css";
import logo from "../assets/LogoAtempoPNG.png";
import {
  FaUpload,
  FaSave,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import avatar from "../assets/avatar.png";

const initCard = () => ({
  nombres: "",
  apellidos: "",
  celular: "",
  email: "",
  fotoFile: null,
  fotoPreview: null,
  error: "",
});

const ALLOWED_MIMES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const MAX_FILE_SIZE = 2 * 1024 * 1024;

const PLAN_LIMITS = {
  GRATIS: 3,
  POPULAR: 8,
  PRO: Infinity,
};

const RegisterEmployees = () => {
  const navigate = useNavigate();
  const [cards, setCards] = useState([initCard(), initCard()]);
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState("");

  const [maxEmployees, setMaxEmployees] = useState(3);

  const carouselRef = useRef(null);
  const cardRefs = useRef([]);
  const fileInputRefs = useRef([]);

  const token = localStorage.getItem("token");

  useEffect(() => {
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        const plan = user.plan || "GRATIS"; 
        setMaxEmployees(PLAN_LIMITS[plan] || 3);
      }
    } catch (e) {
      console.error("Error leyendo plan del usuario", e);
      setMaxEmployees(3);
    }

    return () => {
      cards.forEach((c) => {
        if (c.fotoPreview) URL.revokeObjectURL(c.fotoPreview);
      });
    };
  }, []);

  const handleSkip = async () => {
    try {
      if (token) {
        await fetch("/api/auth/complete-onboarding", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (_) {
    } finally {
      navigate("/agenda-diaria");
    }
  };

  const addCard = () => {
    if (cards.length >= maxEmployees) return;

    setCards((prev) => {
      const newCards = [...prev, initCard()];
      setTimeout(() => {
        const lastIndex = newCards.length - 1;
        const newCard = cardRefs.current[lastIndex];
        if (newCard) {
          newCard.scrollIntoView({
            behavior: "smooth",
            inline: "center",
            block: "nearest",
          });
        }
      }, 50);
      return newCards;
    });
  };

  const openFilePicker = (i) => {
    fileInputRefs.current[i]?.click();
  };

  const handleFileChange = (i, e) => {
    const file = e.target.files?.[0] || null;

    if (file) {
      if (!ALLOWED_MIMES.includes(file.type)) {
        setCards((prev) => {
          const copy = [...prev];
          copy[i] = {
            ...copy[i],
            error: "Formato de imagen no permitido (png, jpg, jpeg, webp).",
          };
          return copy;
        });
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setCards((prev) => {
          const copy = [...prev];
          copy[i] = { ...copy[i], error: "La imagen debe pesar máximo 2MB." };
          return copy;
        });
        return;
      }
    }

    setCards((prev) => {
      const copy = [...prev];
      copy[i] = { ...copy[i] };
      if (copy[i].fotoPreview) URL.revokeObjectURL(copy[i].fotoPreview);
      copy[i].fotoFile = file;
      copy[i].fotoPreview = file ? URL.createObjectURL(file) : null;

      copy[i].error = ""; 
      
      return copy;
    });
  };

  const updateField = (i, field, value) => {
    setCards((prev) => {
      const copy = [...prev];
      copy[i] = { ...copy[i], [field]: value, error: "" };
      return copy;
    });
  };

  const validateCard = (c) => {
    if (!c.nombres.trim()) return "El nombre es obligatorio.";
    if (!c.apellidos.trim()) return "Los apellidos son obligatorios.";

    if (!/^\d{10}$/.test(c.celular.trim()))
      return "El celular debe tener 10 dígitos.";
      
    if (!/^\S+@\S+\.\S+$/.test(c.email.trim()))
      return "El correo electrónico no es válido.";
    if (!c.fotoFile) return "La foto del empleado es obligatoria.";
    return "";
  };

  const handleSave = async () => {
    setGlobalError("");

    const toSend = cards.filter(
      (c) =>
        c.nombres.trim() ||
        c.apellidos.trim() ||
        c.celular.trim() ||
        c.email.trim() ||
        c.fotoFile
    );

    if (toSend.length === 0) {
      return handleSkip();
    }

    let hasError = false;
    const newCards = cards.map((c) => {
      const err =
        c.nombres || c.apellidos || c.celular || c.email || c.fotoFile
          ? validateCard(c)
          : "";
      if (err) hasError = true;
      return { ...c, error: err };
    });
    setCards(newCards);
    if (hasError) {
      setGlobalError("Revisa los campos marcados antes de guardar.");
      return;
    }

    if (!token) {
      setGlobalError("No hay sesión activa. Inicia sesión nuevamente.");
      return;
    }

    setSubmitting(true);
    try {
      const requests = toSend.map(async (c) => {
        const fd = new FormData();
        fd.append("nombres", c.nombres.trim());
        fd.append("apellidos", c.apellidos.trim());
        fd.append("celular", c.celular.trim());
        fd.append("email", c.email.trim());
        if (c.fotoFile) fd.append("foto", c.fotoFile);

        const res = await fetch("/api/empleados", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
        const data = await res.json();
        if (!res.ok || !data?.ok) {
          throw new Error(data?.message || "No se pudo crear un empleado.");
        }
        return data.data;
      });

      await Promise.all(requests);

      await fetch("/api/auth/complete-onboarding", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      navigate("/agenda-diaria");
    } catch (err) {
      setGlobalError(err.message || "Error al guardar empleados.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-content-wrapper">
        <div>
          <img src={logo} alt="Logo Atempo" className="register-logo" />
          <h1 className="register-title">Atempo</h1>
          <h2 className="register-subtitle">Registro de empleados</h2>
        </div>

        {globalError && (
          <div className="alert error" role="alert">
            {globalError}
          </div>
        )}

        <div className="register-carousel-wrapper">
          <div
            className="register-carousel-arrow left"
            onClick={() =>
              carouselRef.current?.scrollBy({ left: -300, behavior: "smooth" })
            }
          >
            <FaChevronLeft />
          </div>

          <div
            className="register-carousel"
            ref={carouselRef}
            style={{ maxWidth: "100%", overflowX: "auto" }}
          >
            {cards.map((card, i) => (
              <div
                className="register-card"
                key={i}
                ref={(el) => (cardRefs.current[i] = el)}
                style={{ position: 'relative' }} 
              >
                <h3>Nuevo empleado</h3>

                <img
                  src={card.fotoPreview || avatar}
                  alt="Avatar empleado"
                  className="register-avatar"
                />

                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  ref={(el) => (fileInputRefs.current[i] = el)}
                  style={{ display: "none" }}
                  onChange={(e) => handleFileChange(i, e)}
                />
                <button
                  type="button"
                  className="register-upload-button"
                  onClick={() => openFilePicker(i)}
                >
                  <FaUpload className="icono-upload" />
                  Cargar foto
                </button>

                {!card.fotoFile &&
                  card.error === "La foto del empleado es obligatoria." && (
                    <p 
                      className="field-error"
                      style={{
                        position: 'absolute',
                        bottom: '15px', 
                        left: '0', 
                        width: '100%',
                        textAlign: 'center',
                        fontSize: '0.8rem',
                        margin: 0
                      }}
                    >
                      * Sube una foto del empleado
                    </p>
                  )}

                <div className="register-input-group">
                  <input
                    type="text"
                    placeholder=" "
                    maxLength="25"
                    required
                    value={card.nombres}
                    onChange={(e) =>
                      updateField(
                        i,
                        "nombres",
                        e.target.value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ\s]/g, "")
                      )
                    }
                  />
                  <label className="register-floating-label">Nombre</label>
                </div>

                <div className="register-input-group">
                  <input
                    type="text"
                    placeholder=" "
                    maxLength="50"
                    required
                    value={card.apellidos}
                    autoComplete="off"
                    onChange={(e) =>
                      updateField(
                        i,
                        "apellidos",
                        e.target.value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ\s]/g, "")
                      )
                    }
                  />
                  <label className="register-floating-label">Apellidos</label>
                </div>

                <div className="register-input-group">
                  <input
                    type="tel"
                    placeholder=" "
                    maxLength="10"
                    required
                    inputMode="numeric"
                    pattern="\d{10}"
                    autoComplete="off"
                    value={card.celular}
                    onChange={(e) =>
                      updateField(
                        i,
                        "celular",
                        e.target.value.replace(/[^0-9]/g, "")
                      )
                    }
                  />
                  <label className="register-floating-label">
                    Número celular
                  </label>
                </div>

                <div className="register-input-group">
                  <input
                    type="email"
                    placeholder=" "
                    maxLength="100"
                    autoComplete="off"
                    required
                    value={card.email}
                    onChange={(e) => updateField(i, "email", e.target.value)}
                  />
                  <label className="register-floating-label">
                    Correo electrónico
                  </label>
                </div>

                {card.error && card.error !== "La foto del empleado es obligatoria." && (
                   <p 
                     className="field-error"
                     style={{
                       position: 'absolute',
                       bottom: '10px', 
                       left: '0', 
                       width: '100%',
                       textAlign: 'center',
                       fontSize: '0.8rem',
                       margin: 0,
                       backgroundColor: 'rgba(255,255,255,0.9)',
                       zIndex: 10
                     }}
                   >
                     {card.error}
                   </p>
                )}
              </div>
            ))}

            {cards.length < maxEmployees && (
              <div className="register-card register-card-plus" onClick={addCard}>
                <span className="register-plus-button">+</span>
                <p>Agregar empleado</p>
                <p style={{fontSize: '0.7rem', marginTop: '5px', color: '#666'}}>
                  {cards.length} / {maxEmployees === Infinity ? '∞' : maxEmployees}
                </p>
              </div>
            )}
          </div>

          <div
            className="register-carousel-arrow right"
            onClick={() =>
              carouselRef.current?.scrollBy({ left: 300, behavior: "smooth" })
            }
          >
            <FaChevronRight />
          </div>
        </div>

        <button
          className="register-save-button"
          onClick={handleSave}
          disabled={submitting || cards.some(c => !!c.error)}
        >
          <FaSave className="icono-guardar" />
          {submitting ? "Guardando..." : "Guardar"}
        </button>
      </div>

      <p className="register-skip-text">
        Si no tienes empleados o quieres registrarlos después, puedes{" "}
        <span onClick={handleSkip} className="register-skip-link">
          Omitir por ahora &gt;
        </span>
        <br />
        Desde la sección “Empleados” puedes registrar nuevos empleados cuando
        desees
      </p>
    </div>
  );
};

export default RegisterEmployees;