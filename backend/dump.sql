--
-- PostgreSQL database dump
--

\restrict KTjh5mplKpL9uqyFpcnPvSR06gk1V5b78z9vY5YvyxhYRxDsrb4en8tKhWdsnMD

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: results; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.results (
    id integer NOT NULL,
    user_id integer,
    image_name character varying(255),
    image_url text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    model character varying(20) DEFAULT 'basic'::character varying
);


ALTER TABLE public.results OWNER TO postgres;

--
-- Name: results_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.results_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.results_id_seq OWNER TO postgres;

--
-- Name: results_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.results_id_seq OWNED BY public.results.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    password character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    credit integer DEFAULT 10
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: results id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.results ALTER COLUMN id SET DEFAULT nextval('public.results_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: results; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.results (id, user_id, image_name, image_url, created_at, model) FROM stdin;
12	1	Tidak dipastikan 336492.crdownload	uploads/1785821407173.crdownload	2026-08-04 12:30:25.886675	basic
18	1	TVアニメ『勇者パーティを追い出された器用貧乏』.jpg	uploads/1785825986281.jpg	2026-08-04 13:46:29.798077	basic
22	1	download (4).jpg	uploads/1785999109532.jpg	2026-08-06 13:51:49.599229	basic
23	1	🥜🎀🌸 Anya Forger 🌸🎀🥜.jpg	uploads/1785999158773.jpg	2026-08-06 13:52:38.798072	advanced
27	1	Kurumi Tokisaki ( 時崎狂三 ).jpg	uploads/1786085861832.jpg	2026-08-07 13:57:41.881622	advanced
33	1	Kurumi Tokisaki ( 時崎狂三 ).jpg	uploads/1786094753178.jpg	2026-08-07 16:25:56.707211	basic
35	1	Marin Kitawaga 💕💕.jpg	uploads/1786096140797.jpg	2026-08-07 16:49:01.005058	advanced
40	1	Marin Kitawaga 💕💕.jpg	uploads/1786176545014.jpg	2026-08-08 15:09:05.057888	basic
42	1	Kurumi Tokisaki ( 時崎狂三 ).jpg	uploads/1786329208673.jpg	2026-08-10 09:33:28.697944	basic
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, email, password, created_at, credit) FROM stdin;
1	Admin	admin@gmail.com	12345678	2026-08-01 15:59:02.731212	9
\.


--
-- Name: results_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.results_id_seq', 42, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 1, true);


--
-- Name: results results_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.results
    ADD CONSTRAINT results_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: results results_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.results
    ADD CONSTRAINT results_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict KTjh5mplKpL9uqyFpcnPvSR06gk1V5b78z9vY5YvyxhYRxDsrb4en8tKhWdsnMD

