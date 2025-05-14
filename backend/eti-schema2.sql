--
-- PostgreSQL database dump
--

-- Dumped from database version 17.0
-- Dumped by pg_dump version 17.0

-- Started on 2025-05-14 14:14:15

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

--
-- TOC entry 3 (class 3079 OID 17794)
-- Name: citext; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA public;


--
-- TOC entry 5158 (class 0 OID 0)
-- Dependencies: 3
-- Name: EXTENSION citext; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION citext IS 'data type for case-insensitive character strings';


--
-- TOC entry 2 (class 3079 OID 17783)
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- TOC entry 5159 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- TOC entry 264 (class 1255 OID 18764)
-- Name: generate_certificate_id(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.generate_certificate_id() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    prefix TEXT := 'CERT-';
    random_str TEXT;
BEGIN
    random_str := encode(sha256(random()::text::bytea), 'hex');
    NEW.certificate_id := prefix || substring(random_str from 1 for 8) || '-' || substring(random_str from 9 for 4) || '-' || substring(random_str from 13 for 4);
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.generate_certificate_id() OWNER TO postgres;

--
-- TOC entry 287 (class 1255 OID 18765)
-- Name: set_certificate_url(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.set_certificate_url() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.certificate_url IS NULL THEN
        NEW.certificate_url := 'https://your-domain.com/certificates/' || NEW.certificate_id || '.pdf';
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.set_certificate_url() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 230 (class 1259 OID 18970)
-- Name: assessment_attempts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assessment_attempts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    assessment_id uuid,
    user_id uuid,
    score integer,
    attempt_number integer NOT NULL,
    submitted_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.assessment_attempts OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 18954)
-- Name: assessments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assessments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    course_id uuid,
    title character varying(255) NOT NULL,
    description text,
    max_score integer NOT NULL,
    passing_score integer DEFAULT 85 NOT NULL,
    max_attempts integer DEFAULT 3 NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.assessments OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 18988)
-- Name: certificates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.certificates (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    course_id uuid,
    certificate_id character varying(50) NOT NULL,
    certificate_url character varying(255) NOT NULL,
    issued_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.certificates OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 18861)
-- Name: course_completions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.course_completions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    course_id uuid,
    completion_date timestamp without time zone,
    score numeric(5,2),
    certificate_issued boolean DEFAULT false,
    certificate_id character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.course_completions OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 19063)
-- Name: course_content; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.course_content (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    course_id uuid,
    title character varying(255) NOT NULL,
    file_type character varying(50) NOT NULL,
    file_url character varying(255) NOT NULL,
    uploaded_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT course_content_file_type_check CHECK (((file_type)::text = ANY ((ARRAY['video'::character varying, 'pdf'::character varying, 'ebook'::character varying, 'other'::character varying])::text[])))
);


ALTER TABLE public.course_content OWNER TO postgres;

--
-- TOC entry 236 (class 1259 OID 19097)
-- Name: course_purchases; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.course_purchases (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid,
    course_id uuid,
    purchase_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    amount numeric(10,2) NOT NULL,
    payment_status character varying(50) DEFAULT 'pending'::character varying,
    CONSTRAINT course_purchases_payment_status_check CHECK (((payment_status)::text = ANY ((ARRAY['pending'::character varying, 'completed'::character varying, 'failed'::character varying])::text[])))
);


ALTER TABLE public.course_purchases OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 18897)
-- Name: course_submissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.course_submissions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    course_id uuid,
    instructor_id uuid,
    outline text NOT NULL,
    scheme_of_work text,
    submitted_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    admin_comments text,
    CONSTRAINT course_submissions_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[])))
);


ALTER TABLE public.course_submissions OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 18793)
-- Name: courses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.courses (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    instructor_id uuid,
    price numeric(10,2) DEFAULT 0.00 NOT NULL,
    duration integer,
    course_type character varying(20) NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    approved_at timestamp without time zone,
    CONSTRAINT courses_course_type_check CHECK (((course_type)::text = ANY ((ARRAY['live'::character varying, 'prerecorded'::character varying, 'ebook'::character varying])::text[]))),
    CONSTRAINT courses_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[])))
);


ALTER TABLE public.courses OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 18918)
-- Name: discussion_forums; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.discussion_forums (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    course_id uuid,
    title character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.discussion_forums OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 18930)
-- Name: discussion_posts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.discussion_posts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    forum_id uuid,
    user_id uuid,
    content text NOT NULL,
    parent_post_id uuid,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.discussion_posts OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 18825)
-- Name: ebooks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ebooks (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    course_id uuid,
    title character varying(255) NOT NULL,
    file_url character varying(255) NOT NULL,
    order_index integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.ebooks OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 18839)
-- Name: enrollments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.enrollments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    course_id uuid,
    enrollment_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    payment_status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    paid_amount numeric(10,2),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT enrollments_payment_status_check CHECK (((payment_status)::text = ANY ((ARRAY['pending'::character varying, 'completed'::character varying, 'failed'::character varying])::text[])))
);


ALTER TABLE public.enrollments OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 18883)
-- Name: events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.events (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    course_id uuid,
    title character varying(255) NOT NULL,
    start_time timestamp without time zone NOT NULL,
    end_time timestamp without time zone NOT NULL,
    google_calendar_event_id character varying(255),
    timezone character varying(50) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.events OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 19033)
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    notification_type character varying(50) NOT NULL,
    message text NOT NULL,
    read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    recipient_type character varying(100) DEFAULT 'all'::character varying NOT NULL,
    CONSTRAINT notifications_notification_type_check CHECK (((notification_type)::text = ANY ((ARRAY['admin_notification'::character varying, 'general'::character varying, 'system_alert'::character varying])::text[])))
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 19007)
-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    course_id uuid,
    enrollment_id uuid,
    paystack_reference character varying(100) NOT NULL,
    amount numeric(10,2) NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT payments_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'completed'::character varying, 'failed'::character varying])::text[])))
);


ALTER TABLE public.payments OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 18811)
-- Name: prerecorded_videos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.prerecorded_videos (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    course_id uuid,
    video_url character varying(255) NOT NULL,
    title character varying(255) NOT NULL,
    duration integer NOT NULL,
    order_index integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.prerecorded_videos OWNER TO postgres;

--
-- TOC entry 239 (class 1259 OID 19161)
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.refresh_tokens (
    id integer NOT NULL,
    user_id uuid,
    token text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.refresh_tokens OWNER TO postgres;

--
-- TOC entry 238 (class 1259 OID 19160)
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.refresh_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.refresh_tokens_id_seq OWNER TO postgres;

--
-- TOC entry 5160 (class 0 OID 0)
-- Dependencies: 238
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.refresh_tokens_id_seq OWNED BY public.refresh_tokens.id;


--
-- TOC entry 237 (class 1259 OID 19118)
-- Name: reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid,
    course_id uuid,
    rating integer,
    comment text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


ALTER TABLE public.reviews OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 19078)
-- Name: student_courses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.student_courses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_id uuid,
    course_id uuid,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.student_courses OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 18779)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    email public.citext NOT NULL,
    password_hash text,
    role character varying(20) DEFAULT 'student'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    bio text,
    expertise character varying(255),
    oauth_provider character varying(50),
    oauth_id character varying(100),
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['student'::character varying, 'instructor'::character varying, 'admin'::character varying])::text[]))),
    CONSTRAINT valid_email CHECK ((email OPERATOR(public.~*) '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::public.citext))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 4872 (class 2604 OID 19164)
-- Name: refresh_tokens id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('public.refresh_tokens_id_seq'::regclass);


--
-- TOC entry 5143 (class 0 OID 18970)
-- Dependencies: 230
-- Data for Name: assessment_attempts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assessment_attempts (id, assessment_id, user_id, score, attempt_number, submitted_at, created_at) FROM stdin;
\.


--
-- TOC entry 5142 (class 0 OID 18954)
-- Dependencies: 229
-- Data for Name: assessments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assessments (id, course_id, title, description, max_score, passing_score, max_attempts, created_at) FROM stdin;
\.


--
-- TOC entry 5144 (class 0 OID 18988)
-- Dependencies: 231
-- Data for Name: certificates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.certificates (id, user_id, course_id, certificate_id, certificate_url, issued_date) FROM stdin;
\.


--
-- TOC entry 5137 (class 0 OID 18861)
-- Dependencies: 224
-- Data for Name: course_completions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.course_completions (id, user_id, course_id, completion_date, score, certificate_issued, certificate_id, created_at) FROM stdin;
\.


--
-- TOC entry 5147 (class 0 OID 19063)
-- Dependencies: 234
-- Data for Name: course_content; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.course_content (id, course_id, title, file_type, file_url, uploaded_at) FROM stdin;
\.


--
-- TOC entry 5149 (class 0 OID 19097)
-- Dependencies: 236
-- Data for Name: course_purchases; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.course_purchases (id, student_id, course_id, purchase_date, amount, payment_status) FROM stdin;
\.


--
-- TOC entry 5139 (class 0 OID 18897)
-- Dependencies: 226
-- Data for Name: course_submissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.course_submissions (id, course_id, instructor_id, outline, scheme_of_work, submitted_at, status, admin_comments) FROM stdin;
\.


--
-- TOC entry 5133 (class 0 OID 18793)
-- Dependencies: 220
-- Data for Name: courses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.courses (id, title, description, instructor_id, price, duration, course_type, status, created_at, approved_at) FROM stdin;
a569339f-5157-4c12-af50-1495f612ea87	sdf	sdcdfvdfv	057c8841-5ac5-479a-9b0a-91abbd67866a	345.00	3	live	pending	2025-05-13 14:34:52.201368	\N
123e4567-e89b-12d3-a456-426614174000	Test Course	\N	057c8841-5ac5-479a-9b0a-91abbd67866a	100.00	\N	live	approved	2025-05-13 14:52:08.335439	\N
a80ebdb8-3bcc-4b71-b339-d4c1cce8ad65	sdfhggg	sdfghf	057c8841-5ac5-479a-9b0a-91abbd67866a	454.00	45	prerecorded	pending	2025-05-13 15:02:45.678584	\N
\.


--
-- TOC entry 5140 (class 0 OID 18918)
-- Dependencies: 227
-- Data for Name: discussion_forums; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.discussion_forums (id, course_id, title, created_at) FROM stdin;
\.


--
-- TOC entry 5141 (class 0 OID 18930)
-- Dependencies: 228
-- Data for Name: discussion_posts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.discussion_posts (id, forum_id, user_id, content, parent_post_id, created_at) FROM stdin;
\.


--
-- TOC entry 5135 (class 0 OID 18825)
-- Dependencies: 222
-- Data for Name: ebooks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ebooks (id, course_id, title, file_url, order_index, created_at) FROM stdin;
\.


--
-- TOC entry 5136 (class 0 OID 18839)
-- Dependencies: 223
-- Data for Name: enrollments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.enrollments (id, user_id, course_id, enrollment_date, payment_status, paid_amount, created_at) FROM stdin;
\.


--
-- TOC entry 5138 (class 0 OID 18883)
-- Dependencies: 225
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.events (id, course_id, title, start_time, end_time, google_calendar_event_id, timezone, created_at) FROM stdin;
\.


--
-- TOC entry 5146 (class 0 OID 19033)
-- Dependencies: 233
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, user_id, notification_type, message, read, created_at, recipient_type) FROM stdin;
e29ed50a-c6f2-4775-a072-c1125007b1b8	f4377572-18fc-4417-9a6b-c1481121bac3	general	hi guys	f	2025-05-13 16:26:42.448353	all
6247bf8c-95ea-4043-851e-c81797d538a3	37b835e0-dd9e-4fed-b534-c8f5c1ecc4ef	general	hi guys	f	2025-05-13 16:26:42.570863	all
a63266c2-2e03-41ba-a832-01eba08ff68c	f6502877-92c9-44e1-aee8-b88f3a37a8c1	general	hi guys	f	2025-05-13 16:26:42.574174	all
0ed9103f-96eb-4ac2-93f7-7bb88b4186eb	9fdc638b-08da-4d68-8c3b-fdc58d1db892	general	hi guys	f	2025-05-13 16:26:42.577587	all
d538c41f-3a28-46e5-9e3d-6e645e24f273	057c8841-5ac5-479a-9b0a-91abbd67866a	general	hi guys	f	2025-05-13 16:26:42.580876	all
55e2de5f-54e2-4de1-8852-d01e3d8020f5	b4c5d4c5-837d-47e6-842d-d150a95b3df0	general	hi guys	f	2025-05-13 16:26:42.875662	all
65273de2-e679-45f7-943c-7fb53f2c7860	4c53fbb1-9065-4f59-b421-7440c7ee892f	general	hi guys	f	2025-05-13 16:26:43.193984	all
012de9b0-62ea-4c55-b4cd-dafea1d412aa	379c438a-0a5d-46a0-ba22-2d59ac4310ee	general	hi guys	f	2025-05-13 16:26:43.29962	all
0028ff06-7054-49dc-944b-4c668ed04e1f	d8086600-6a5d-4fa0-a480-68d87cb9380b	general	hi guys	f	2025-05-13 16:26:43.421923	all
2a082fa0-b8b0-4bb6-b464-4dfbb2bc6af3	ff6fb9d1-3620-42bb-84fc-21a726cdc803	general	hi guys	f	2025-05-13 16:26:43.476294	all
addb3fe8-f881-436f-a158-9b7931f2d755	29ef7a83-26a3-4848-a585-d4f4dfcd02ff	general	hi guys	f	2025-05-13 16:26:43.582942	all
a40d133e-9c6b-4b4f-88ab-84a6b92bc043	877a0ace-a016-4786-b2c5-e7e8313a0d86	general	hi guys	f	2025-05-13 16:26:43.713184	all
28967aa8-8f62-427b-95dc-e178fd6bfe1d	eedaddcd-120e-4c71-b613-12377a9da3c7	general	hi guys	f	2025-05-13 16:26:43.914817	all
c36be6a6-3de3-40d6-893a-f8e7e1b596e6	4e37d3c8-534c-4900-ad40-08aebcc13e49	general	hi guys	f	2025-05-13 16:26:44.006323	all
fe2b2edc-9de0-4428-a5cd-a5a3975f94b1	f4377572-18fc-4417-9a6b-c1481121bac3	general	how una dey	f	2025-05-13 18:58:15.041537	students
cc58c729-655f-4b94-bdd7-8eacb32df7a4	b4c5d4c5-837d-47e6-842d-d150a95b3df0	general	how una dey	f	2025-05-13 18:58:15.331898	students
248cfdb5-b646-4ac5-86aa-bd436bb81f83	d8086600-6a5d-4fa0-a480-68d87cb9380b	general	how una dey	f	2025-05-13 18:58:15.492508	students
0e13457a-d382-4235-b31a-6ad6f53d25ae	379c438a-0a5d-46a0-ba22-2d59ac4310ee	general	how una dey	f	2025-05-13 18:58:15.685665	students
b1b965fd-266a-489b-95ee-8cf0d5c31e63	eedaddcd-120e-4c71-b613-12377a9da3c7	general	how una dey	f	2025-05-13 18:58:16.2113	students
688c110c-9ba9-4144-9f95-ee87302bf927	37b835e0-dd9e-4fed-b534-c8f5c1ecc4ef	general	how una dey	f	2025-05-13 18:58:16.533888	students
9a7a7deb-fb5d-4037-a9ee-d2bfe437c87a	29ef7a83-26a3-4848-a585-d4f4dfcd02ff	general	how una dey	f	2025-05-13 18:58:16.732017	students
6ba6a691-2208-4218-b064-10fd2c698bfc	fd021f7e-9b23-4866-8888-e0fa7b41c0b2	general	how una dey	f	2025-05-13 18:58:16.826094	students
71c740e0-3d01-48b2-83d6-e7959ad86080	f6502877-92c9-44e1-aee8-b88f3a37a8c1	general	how una dey	f	2025-05-13 18:58:17.039579	students
64b3a70a-96e9-455e-9905-bb415114dfa9	f4377572-18fc-4417-9a6b-c1481121bac3	general	hi eariesx	f	2025-05-13 19:08:50.337325	all
5fadbcba-980b-45a7-b464-999b5b1714ad	37b835e0-dd9e-4fed-b534-c8f5c1ecc4ef	general	hi eariesx	f	2025-05-13 19:08:50.361319	all
8790f4ff-3c8c-4ca4-a5d6-c587e5e8cb13	f6502877-92c9-44e1-aee8-b88f3a37a8c1	general	hi eariesx	f	2025-05-13 19:08:50.364529	all
f986727c-5a57-4f02-bb5d-43e0a9987920	9fdc638b-08da-4d68-8c3b-fdc58d1db892	general	hi eariesx	f	2025-05-13 19:08:50.368826	all
40da1336-cd4d-43bc-be0e-d09229968e1d	057c8841-5ac5-479a-9b0a-91abbd67866a	general	hi eariesx	f	2025-05-13 19:08:50.37236	all
08a49fe4-d79c-4aa5-9a30-b6620231ba3b	fd021f7e-9b23-4866-8888-e0fa7b41c0b2	general	hi eariesx	f	2025-05-13 19:08:50.375556	all
dedbecaf-ccf1-4a07-8d92-7ba875300b9b	335338da-82c6-4a74-985d-700c5f63e835	general	hi eariesx	f	2025-05-13 19:08:50.378609	all
aa4fdbc2-3c34-42a5-baba-e9f82292336a	984f1a8b-083b-4678-bf9d-f89f4b50f937	general	hi eariesx	f	2025-05-13 19:08:50.381937	all
0efde4bd-55f6-432f-85b8-f7493d4a79c5	b4c5d4c5-837d-47e6-842d-d150a95b3df0	general	hi eariesx	f	2025-05-13 19:08:50.631275	all
43116084-a0f8-41b4-a08a-8a3c21f6cb2d	4c53fbb1-9065-4f59-b421-7440c7ee892f	general	hi eariesx	f	2025-05-13 19:08:50.742427	all
e4b3a6b7-9bb5-48fc-b115-1273188cad74	379c438a-0a5d-46a0-ba22-2d59ac4310ee	general	hi eariesx	f	2025-05-13 19:08:50.865386	all
d961a7eb-ee92-44f3-8d4b-6d3b464ac6ad	d8086600-6a5d-4fa0-a480-68d87cb9380b	general	hi eariesx	f	2025-05-13 19:08:51.002475	all
3e3d3911-d6c6-44f4-be96-2bcb73cf0def	eedaddcd-120e-4c71-b613-12377a9da3c7	general	hi eariesx	f	2025-05-13 19:08:51.292227	all
903e116e-2318-4bce-9f5d-dbb9e54e92d1	ff6fb9d1-3620-42bb-84fc-21a726cdc803	general	hi eariesx	f	2025-05-13 19:08:51.396775	all
7fb9fea7-f000-4179-ac6f-11a116cc5a42	29ef7a83-26a3-4848-a585-d4f4dfcd02ff	general	hi eariesx	f	2025-05-13 19:08:51.51191	all
e5d425df-c9a3-4e93-b59d-367b7e5409fb	877a0ace-a016-4786-b2c5-e7e8313a0d86	general	hi eariesx	f	2025-05-13 19:08:51.692423	all
5e303164-19e5-4364-9735-312f14375c5a	4e37d3c8-534c-4900-ad40-08aebcc13e49	general	hi eariesx	f	2025-05-13 19:08:51.800541	all
f4da97b2-787c-4c7c-a89e-e20ea8f7b2e8	f4377572-18fc-4417-9a6b-c1481121bac3	general	hey dearies	f	2025-05-13 19:09:09.031228	students
652399d4-3417-4a98-9a57-3424c7e2dd06	b4c5d4c5-837d-47e6-842d-d150a95b3df0	general	hey dearies	f	2025-05-13 19:09:09.61945	students
368be211-4e98-48aa-b535-c9e56665e98f	379c438a-0a5d-46a0-ba22-2d59ac4310ee	general	hey dearies	f	2025-05-13 19:09:09.796245	students
9ac5abb5-26f3-4529-9e4f-341c7e2a39e4	d8086600-6a5d-4fa0-a480-68d87cb9380b	general	hey dearies	f	2025-05-13 19:09:10.012552	students
3a30c52d-ad29-428a-98db-00fc6ebe508f	eedaddcd-120e-4c71-b613-12377a9da3c7	general	hey dearies	f	2025-05-13 19:09:10.187323	students
f03ea478-cb42-43df-b673-f15cd1b7ca1f	37b835e0-dd9e-4fed-b534-c8f5c1ecc4ef	general	hey dearies	f	2025-05-13 19:09:10.362066	students
8a74590f-bc2b-4682-8968-05bf5ee81257	f6502877-92c9-44e1-aee8-b88f3a37a8c1	general	hey dearies	f	2025-05-13 19:09:10.542704	students
9779a85b-1489-4dc0-bc38-c1e9705769fa	fd021f7e-9b23-4866-8888-e0fa7b41c0b2	general	hey dearies	f	2025-05-13 19:09:10.769104	students
edca04fa-7e6c-428a-a2b4-ea9e08ea8374	29ef7a83-26a3-4848-a585-d4f4dfcd02ff	general	hey dearies	f	2025-05-13 19:09:10.97312	students
\.


--
-- TOC entry 5145 (class 0 OID 19007)
-- Dependencies: 232
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payments (id, user_id, course_id, enrollment_id, paystack_reference, amount, status, created_at) FROM stdin;
02c03249-5faa-4664-b6ab-1a69e69462df	37b835e0-dd9e-4fed-b534-c8f5c1ecc4ef	123e4567-e89b-12d3-a456-426614174000	\N	test-ref-123	100.00	completed	2025-05-13 14:55:49.354435
\.


--
-- TOC entry 5134 (class 0 OID 18811)
-- Dependencies: 221
-- Data for Name: prerecorded_videos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.prerecorded_videos (id, course_id, video_url, title, duration, order_index, created_at) FROM stdin;
\.


--
-- TOC entry 5152 (class 0 OID 19161)
-- Dependencies: 239
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.refresh_tokens (id, user_id, token, created_at) FROM stdin;
6	379c438a-0a5d-46a0-ba22-2d59ac4310ee	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjM3OWM0MzhhLTBhNWQtNDZhMC1iYTIyLTJkNTlhYzQzMTBlZSIsImVtYWlsIjoib2Z1b2t3dXZlcm9uaWNhMzdAZ21haWwuY29tIiwicm9sZSI6InN0dWRlbnQiLCJpYXQiOjE3NDU1NzgyMjIsImV4cCI6MTc0NjE4MzAyMn0.ppkxZ06qPW6G1NC54TjvMFoEZVgYsakJ-n6G3KdvHz4	2025-04-25 11:50:22.93824
9	37b835e0-dd9e-4fed-b534-c8f5c1ecc4ef	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjM3YjgzNWUwLWRkOWUtNGZlZC1iNTM0LWM4ZjVjMWVjYzRlZiIsImVtYWlsIjoiV2l6YXJka2luZzIxMjVAZ21haWwuY29tIiwicm9sZSI6InN0dWRlbnQiLCJpYXQiOjE3NDU1ODMwNjgsImV4cCI6MTc0NjE4Nzg2OH0.cHv1NMzw7_CXFBpB7EKHh0EyLnkAJechO2khL4doEbA	2025-04-25 13:11:08.537608
10	d8086600-6a5d-4fa0-a480-68d87cb9380b	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImQ4MDg2NjAwLTZhNWQtNGZhMC1hNDgwLTY4ZDg3Y2I5MzgwYiIsImVtYWlsIjoidHV0b3JAZ21haWwuY29tIiwicm9sZSI6InN0dWRlbnQiLCJpYXQiOjE3NDU1ODM1MjIsImV4cCI6MTc0NjE4ODMyMn0.Oekmzs0Fle3zYtYR1LQo7bTp0pYrS4XRnomrCWP66JY	2025-04-25 13:18:42.705374
11	ff6fb9d1-3620-42bb-84fc-21a726cdc803	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImZmNmZiOWQxLTM2MjAtNDJiYi04NGZjLTIxYTcyNmNkYzgwMyIsImVtYWlsIjoiYWRtaW5AZ21haWwuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ1NTgzNjAzLCJleHAiOjE3NDYxODg0MDN9.l98HDPwGNEkDvj5NWa92ZftCWzNtAN22C39_Y7GxQdI	2025-04-25 13:20:03.34154
12	f6502877-92c9-44e1-aee8-b88f3a37a8c1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImY2NTAyODc3LTkyYzktNDRlMS1hZWU4LWI4OGYzYTM3YThjMSIsImVtYWlsIjoidmljdG9yeWF6dWRvbmlAZ21haWwuY29tIiwicm9sZSI6InN0dWRlbnQiLCJpYXQiOjE3NDU1OTE3MjQsImV4cCI6MTc0NjE5NjUyNH0.GwEaDyOPSdnMIdeRTRcqvqloNEYnnAvi1MS5HA4eCGc	2025-04-25 15:35:24.17756
13	ff6fb9d1-3620-42bb-84fc-21a726cdc803	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImZmNmZiOWQxLTM2MjAtNDJiYi04NGZjLTIxYTcyNmNkYzgwMyIsImVtYWlsIjoiYWRtaW5AZ21haWwuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ1NTkzMDU0LCJleHAiOjE3NDYxOTc4NTR9.RpUewpp99YZEpDNVykDqGjDsLIuWhTrk9vyMjp_o00I	2025-04-25 15:57:34.894031
14	379c438a-0a5d-46a0-ba22-2d59ac4310ee	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjM3OWM0MzhhLTBhNWQtNDZhMC1iYTIyLTJkNTlhYzQzMTBlZSIsImVtYWlsIjoib2Z1b2t3dXZlcm9uaWNhMzdAZ21haWwuY29tIiwicm9sZSI6InN0dWRlbnQiLCJpYXQiOjE3NDU5MzMzMzUsImV4cCI6MTc0NjUzODEzNX0.ttW6vx3imzTrvWD9yCAa6HtLprPiq3FZmfO6-mPLGGw	2025-04-29 14:28:55.171797
15	d8086600-6a5d-4fa0-a480-68d87cb9380b	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImQ4MDg2NjAwLTZhNWQtNGZhMC1hNDgwLTY4ZDg3Y2I5MzgwYiIsImVtYWlsIjoidHV0b3JAZ21haWwuY29tIiwicm9sZSI6InN0dWRlbnQiLCJpYXQiOjE3NDYyMTI0MjksImV4cCI6MTc0NjgxNzIyOX0.cZ8n-GnSpKp9I0xIPD-oBHlQcSvSiZXNXPIiN37hGBA	2025-05-02 20:00:29.967972
16	ff6fb9d1-3620-42bb-84fc-21a726cdc803	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImZmNmZiOWQxLTM2MjAtNDJiYi04NGZjLTIxYTcyNmNkYzgwMyIsImVtYWlsIjoiYWRtaW5AZ21haWwuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ2MjEzNzM2LCJleHAiOjE3NDY4MTg1MzZ9.UWT2ApuxXZ36exPvg8LOdbZco3v6MLmpoLmQjTp7Kdw	2025-05-02 20:22:16.899953
17	ff6fb9d1-3620-42bb-84fc-21a726cdc803	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImZmNmZiOWQxLTM2MjAtNDJiYi04NGZjLTIxYTcyNmNkYzgwMyIsImVtYWlsIjoiYWRtaW5AZ21haWwuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ2Nzg2MTEzLCJleHAiOjE3NDczOTA5MTN9.rNW75NQb5IH_iyfZZbAVOFt5I-zjJkBDKSEu-n342h8	2025-05-09 11:21:53.080729
18	ff6fb9d1-3620-42bb-84fc-21a726cdc803	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImZmNmZiOWQxLTM2MjAtNDJiYi04NGZjLTIxYTcyNmNkYzgwMyIsImVtYWlsIjoiYWRtaW5AZ21haWwuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ2Nzg4NDU1LCJleHAiOjE3NDczOTMyNTV9.aMWbaT1Eysm8tMM3sgexELHzHBp0g4LElp1D2qUY4h4	2025-05-09 12:00:55.398515
19	ff6fb9d1-3620-42bb-84fc-21a726cdc803	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImZmNmZiOWQxLTM2MjAtNDJiYi04NGZjLTIxYTcyNmNkYzgwMyIsImVtYWlsIjoiYWRtaW5AZ21haWwuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzQ2Nzg4NjQ4LCJleHAiOjE3NDczOTM0NDh9.9_tZMMFwswFbAoITHP3rjLxnJEZAFuwYNkMKprvek3I	2025-05-09 12:04:08.624586
20	9fdc638b-08da-4d68-8c3b-fdc58d1db892	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjlmZGM2MzhiLTA4ZGEtNGQ2OC04YzNiLWZkYzU4ZDFkYjg5MiIsImVtYWlsIjoiYWRtaW4yQGdtYWlsLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc0Njc5NDE1NiwiZXhwIjoxNzQ3Mzk4OTU2fQ.lilw_0KEDkx6ypZz-3dR-0y8KkN3GYDoB9J80JbSb40	2025-05-09 13:35:56.419658
21	9fdc638b-08da-4d68-8c3b-fdc58d1db892	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjlmZGM2MzhiLTA4ZGEtNGQ2OC04YzNiLWZkYzU4ZDFkYjg5MiIsImVtYWlsIjoiYWRtaW4yQGdtYWlsLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc0Njc5NTIwMiwiZXhwIjoxNzQ3NDAwMDAyfQ.vzsJD7PwMktCrPBoC8ZoqQTgc-q5CXWPvhPt2vKuWuo	2025-05-09 13:53:22.548526
22	9fdc638b-08da-4d68-8c3b-fdc58d1db892	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjlmZGM2MzhiLTA4ZGEtNGQ2OC04YzNiLWZkYzU4ZDFkYjg5MiIsImVtYWlsIjoiYWRtaW4yQGdtYWlsLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc0Njc5NTIyNSwiZXhwIjoxNzQ3NDAwMDI1fQ.KWxAnJmeNijJtMj4DfnZO3SMNZOuMpjr1gfM1V-pQrM	2025-05-09 13:53:45.26682
23	9fdc638b-08da-4d68-8c3b-fdc58d1db892	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjlmZGM2MzhiLTA4ZGEtNGQ2OC04YzNiLWZkYzU4ZDFkYjg5MiIsImVtYWlsIjoiYWRtaW4yQGdtYWlsLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc0Njc5NTQ3MSwiZXhwIjoxNzQ3NDAwMjcxfQ.PpoVd-XtYCkDd2oWAt0vcJIUiSIBCyrt3X60puD-rS0	2025-05-09 13:57:51.241265
24	9fdc638b-08da-4d68-8c3b-fdc58d1db892	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjlmZGM2MzhiLTA4ZGEtNGQ2OC04YzNiLWZkYzU4ZDFkYjg5MiIsImVtYWlsIjoiYWRtaW4yQGdtYWlsLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc0Njc5NTUyOCwiZXhwIjoxNzQ3NDAwMzI4fQ.l2WwmthV0_lkwX7JGMFhRAJk5oRsHHttvvQ90pEFCvg	2025-05-09 13:58:48.617313
25	d8086600-6a5d-4fa0-a480-68d87cb9380b	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImQ4MDg2NjAwLTZhNWQtNGZhMC1hNDgwLTY4ZDg3Y2I5MzgwYiIsImVtYWlsIjoidHV0b3JAZ21haWwuY29tIiwicm9sZSI6InN0dWRlbnQiLCJpYXQiOjE3NDY3OTU3MjcsImV4cCI6MTc0NzQwMDUyN30.lqhJEkjXiNfi9t3imkgjvBJ_sCA8FG-6cOeHmpnqaYM	2025-05-09 14:02:07.179217
26	d8086600-6a5d-4fa0-a480-68d87cb9380b	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImQ4MDg2NjAwLTZhNWQtNGZhMC1hNDgwLTY4ZDg3Y2I5MzgwYiIsImVtYWlsIjoidHV0b3JAZ21haWwuY29tIiwicm9sZSI6InN0dWRlbnQiLCJpYXQiOjE3NDY3OTY0ODMsImV4cCI6MTc0NzQwMTI4M30.P_glJ5AQiMi3YvSw7_t0JlUdUw0iZL5nanin3hJOsKs	2025-05-09 14:14:43.16244
27	d8086600-6a5d-4fa0-a480-68d87cb9380b	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImQ4MDg2NjAwLTZhNWQtNGZhMC1hNDgwLTY4ZDg3Y2I5MzgwYiIsImVtYWlsIjoidHV0b3JAZ21haWwuY29tIiwicm9sZSI6InN0dWRlbnQiLCJpYXQiOjE3NDY3OTY1MTAsImV4cCI6MTc0NzQwMTMxMH0.BV7YH_68tmYuZ8J5Ho1QYuqJwW7wgT-ITkXUlUevje4	2025-05-09 14:15:10.464983
28	d8086600-6a5d-4fa0-a480-68d87cb9380b	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImQ4MDg2NjAwLTZhNWQtNGZhMC1hNDgwLTY4ZDg3Y2I5MzgwYiIsImVtYWlsIjoidHV0b3JAZ21haWwuY29tIiwicm9sZSI6InN0dWRlbnQiLCJpYXQiOjE3NDY3OTY1MzUsImV4cCI6MTc0NzQwMTMzNX0.MBsgrDfKUkNEl3988k6SZpVwGeLFbqtxWiUgp-F8oDQ	2025-05-09 14:15:35.704183
29	d8086600-6a5d-4fa0-a480-68d87cb9380b	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImQ4MDg2NjAwLTZhNWQtNGZhMC1hNDgwLTY4ZDg3Y2I5MzgwYiIsImVtYWlsIjoidHV0b3JAZ21haWwuY29tIiwicm9sZSI6InN0dWRlbnQiLCJpYXQiOjE3NDY3OTY1NjksImV4cCI6MTc0NzQwMTM2OX0.OUXhlTK32t_MAZWCw1FGGdxA3elzhCyzH_hFNpQW7fA	2025-05-09 14:16:09.359591
30	d8086600-6a5d-4fa0-a480-68d87cb9380b	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImQ4MDg2NjAwLTZhNWQtNGZhMC1hNDgwLTY4ZDg3Y2I5MzgwYiIsImVtYWlsIjoidHV0b3JAZ21haWwuY29tIiwicm9sZSI6InN0dWRlbnQiLCJpYXQiOjE3NDY3OTY3ODIsImV4cCI6MTc0NzQwMTU4Mn0.cUPZP1Jyi_-5u4o-7tYuvJUsAKlx93uU3BybftTH5fA	2025-05-09 14:19:42.036009
34	9fdc638b-08da-4d68-8c3b-fdc58d1db892	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjlmZGM2MzhiLTA4ZGEtNGQ2OC04YzNiLWZkYzU4ZDFkYjg5MiIsImVtYWlsIjoiYWRtaW4yQGdtYWlsLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc0Njc5NzQ1NywiZXhwIjoxNzQ3NDAyMjU3fQ.KNJVCtUDfjpAdDESks8IJAK8TiQz6eIieQAL7xu09V0	2025-05-09 14:30:57.789646
36	9fdc638b-08da-4d68-8c3b-fdc58d1db892	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjlmZGM2MzhiLTA4ZGEtNGQ2OC04YzNiLWZkYzU4ZDFkYjg5MiIsImVtYWlsIjoiYWRtaW4yQGdtYWlsLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc0NzEzMjU2OSwiZXhwIjoxNzQ3NzM3MzY5fQ.k1U9a2gvAEWHSwm76t06mDnw-uQOIEz9rDO88B_Xrzo	2025-05-13 11:36:09.771019
38	d8086600-6a5d-4fa0-a480-68d87cb9380b	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImQ4MDg2NjAwLTZhNWQtNGZhMC1hNDgwLTY4ZDg3Y2I5MzgwYiIsImVtYWlsIjoidHV0b3JAZ21haWwuY29tIiwicm9sZSI6InN0dWRlbnQiLCJpYXQiOjE3NDcxMzI2MDAsImV4cCI6MTc0NzczNzQwMH0.ym0oNcXCVz0ZBT_eOWtResjYuwmKP8nUiePmIchMNR8	2025-05-13 11:36:40.180744
39	d8086600-6a5d-4fa0-a480-68d87cb9380b	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImQ4MDg2NjAwLTZhNWQtNGZhMC1hNDgwLTY4ZDg3Y2I5MzgwYiIsImVtYWlsIjoidHV0b3JAZ21haWwuY29tIiwicm9sZSI6InN0dWRlbnQiLCJpYXQiOjE3NDcxMzI2MTgsImV4cCI6MTc0NzczNzQxOH0.GfyVEsZU1-DII3T8CHzWDh2LBYzOk0KFKU3sHlPK_bg	2025-05-13 11:36:58.598226
41	379c438a-0a5d-46a0-ba22-2d59ac4310ee	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjM3OWM0MzhhLTBhNWQtNDZhMC1iYTIyLTJkNTlhYzQzMTBlZSIsImVtYWlsIjoib2Z1b2t3dXZlcm9uaWNhMzdAZ21haWwuY29tIiwicm9sZSI6InN0dWRlbnQiLCJpYXQiOjE3NDcxMzMyNDksImV4cCI6MTc0NzczODA0OX0.OzWTwp70FZ0IFJbrBXJmKkSF3OHzp2f35m9im4F57sk	2025-05-13 11:47:29.024102
46	9fdc638b-08da-4d68-8c3b-fdc58d1db892	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjlmZGM2MzhiLTA4ZGEtNGQ2OC04YzNiLWZkYzU4ZDFkYjg5MiIsImVtYWlsIjoiYWRtaW4yQGdtYWlsLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc0NzEzNDk0MCwiZXhwIjoxNzQ3NzM5NzQwfQ.40w0CxeSy2fz6VkcPXDYM9AcyNvBLcbmuwj8sh8gFGU	2025-05-13 12:15:40.957456
47	379c438a-0a5d-46a0-ba22-2d59ac4310ee	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjM3OWM0MzhhLTBhNWQtNDZhMC1iYTIyLTJkNTlhYzQzMTBlZSIsImVtYWlsIjoib2Z1b2t3dXZlcm9uaWNhMzdAZ21haWwuY29tIiwicm9sZSI6InN0dWRlbnQiLCJpYXQiOjE3NDcxMzUwMzMsImV4cCI6MTc0NzczOTgzM30.6QowBrM4ZLnsmGU-VS-PWX9OOF5rcfZfKYQYWqRo6Kw	2025-05-13 12:17:13.090593
49	9fdc638b-08da-4d68-8c3b-fdc58d1db892	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjlmZGM2MzhiLTA4ZGEtNGQ2OC04YzNiLWZkYzU4ZDFkYjg5MiIsImVtYWlsIjoiYWRtaW4yQGdtYWlsLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc0NzEzNTIyMiwiZXhwIjoxNzQ3NzQwMDIyfQ.U2upVfdg-swlts4BKB9bKsWfWLWWi3OUdptcHofBV0s	2025-05-13 12:20:22.269762
50	057c8841-5ac5-479a-9b0a-91abbd67866a	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjA1N2M4ODQxLTVhYzUtNDc5YS05YjBhLTkxYWJiZDY3ODY2YSIsImVtYWlsIjoidmVyb3R1dG9yQGdtYWlsLmNvbSIsInJvbGUiOiJpbnN0cnVjdG9yIiwiaWF0IjoxNzQ3MTM1NDQwLCJleHAiOjE3NDc3NDAyNDB9.f9wwaPEVUEqjFWZmzp4huqwxiDx2YE8iJ-QpTBA2x4E	2025-05-13 12:24:00.979334
51	379c438a-0a5d-46a0-ba22-2d59ac4310ee	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjM3OWM0MzhhLTBhNWQtNDZhMC1iYTIyLTJkNTlhYzQzMTBlZSIsImVtYWlsIjoib2Z1b2t3dXZlcm9uaWNhMzdAZ21haWwuY29tIiwicm9sZSI6InN0dWRlbnQiLCJpYXQiOjE3NDcxMzU5ODQsImV4cCI6MTc0Nzc0MDc4NH0.pDlfRmBaQiTu5uXJtVr8Lcu4ZFNCWDlPuA_fk53TeCw	2025-05-13 12:33:04.153886
52	057c8841-5ac5-479a-9b0a-91abbd67866a	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjA1N2M4ODQxLTVhYzUtNDc5YS05YjBhLTkxYWJiZDY3ODY2YSIsImVtYWlsIjoidmVyb3R1dG9yQGdtYWlsLmNvbSIsInJvbGUiOiJpbnN0cnVjdG9yIiwiaWF0IjoxNzQ3MTM2MDMxLCJleHAiOjE3NDc3NDA4MzF9.GtC7EtCcml2KjkCQGMstixdG69_i100FVvQAPNILot8	2025-05-13 12:33:51.968319
53	9fdc638b-08da-4d68-8c3b-fdc58d1db892	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjlmZGM2MzhiLTA4ZGEtNGQ2OC04YzNiLWZkYzU4ZDFkYjg5MiIsImVtYWlsIjoiYWRtaW4yQGdtYWlsLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc0NzEzNjUzOCwiZXhwIjoxNzQ3NzQxMzM4fQ.qR3LKOcNnx_jf5iFyJYukpjZNBnbB2zCgYqfI4wgRhE	2025-05-13 12:42:18.588264
54	057c8841-5ac5-479a-9b0a-91abbd67866a	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjA1N2M4ODQxLTVhYzUtNDc5YS05YjBhLTkxYWJiZDY3ODY2YSIsImVtYWlsIjoidmVyb3R1dG9yQGdtYWlsLmNvbSIsInJvbGUiOiJpbnN0cnVjdG9yIiwiaWF0IjoxNzQ3MTQxODE2LCJleHAiOjE3NDc3NDY2MTZ9.CAvlaqMod0avrSImMPyE3D5XBF1QdG9KIpEoC8IpeKA	2025-05-13 14:10:16.665178
55	9fdc638b-08da-4d68-8c3b-fdc58d1db892	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjlmZGM2MzhiLTA4ZGEtNGQ2OC04YzNiLWZkYzU4ZDFkYjg5MiIsImVtYWlsIjoiYWRtaW4yQGdtYWlsLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc0NzE0MzM2OSwiZXhwIjoxNzQ3NzQ4MTY5fQ.VHKOwnz12ntZhwiDhN53hcKD3qCV1v0GNQzf9M8MwR4	2025-05-13 14:36:09.814951
56	057c8841-5ac5-479a-9b0a-91abbd67866a	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjA1N2M4ODQxLTVhYzUtNDc5YS05YjBhLTkxYWJiZDY3ODY2YSIsImVtYWlsIjoidmVyb3R1dG9yQGdtYWlsLmNvbSIsInJvbGUiOiJpbnN0cnVjdG9yIiwiaWF0IjoxNzQ3MTQzNTgwLCJleHAiOjE3NDc3NDgzODB9.sV8fcK6_T5RtYxBkdaJAw1PgF3s-K3CKY1-P5wvcKls	2025-05-13 14:39:40.656572
57	9fdc638b-08da-4d68-8c3b-fdc58d1db892	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjlmZGM2MzhiLTA4ZGEtNGQ2OC04YzNiLWZkYzU4ZDFkYjg5MiIsImVtYWlsIjoiYWRtaW4yQGdtYWlsLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc0NzE0NTU1MCwiZXhwIjoxNzQ3NzUwMzUwfQ.kTse2kFcXlnfYJWfhgS95mughZurte4IgzMzwcuLCFY	2025-05-13 15:12:30.101622
58	9fdc638b-08da-4d68-8c3b-fdc58d1db892	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjlmZGM2MzhiLTA4ZGEtNGQ2OC04YzNiLWZkYzU4ZDFkYjg5MiIsImVtYWlsIjoiYWRtaW4yQGdtYWlsLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc0NzE0OTk2NywiZXhwIjoxNzQ3NzU0NzY3fQ.M77M22b_sg7sXiBljS089iO2btkjG2nflfpLpHKLYvE	2025-05-13 16:26:07.200342
59	fd021f7e-9b23-4866-8888-e0fa7b41c0b2	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImZkMDIxZjdlLTliMjMtNDg2Ni04ODg4LWUwZmE3YjQxYzBiMiIsImVtYWlsIjoiYWJhc3NyZW1pbGVrdW5AZ21haWwuY29tIiwicm9sZSI6InN0dWRlbnQiLCJpYXQiOjE3NDcxNTcxNTQsImV4cCI6MTc0Nzc2MTk1NH0.aERcQoO4AigICQsAeijJPQvrAr48Q5VV-kx85xq8qUc	2025-05-13 18:25:54.516803
60	fd021f7e-9b23-4866-8888-e0fa7b41c0b2	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImZkMDIxZjdlLTliMjMtNDg2Ni04ODg4LWUwZmE3YjQxYzBiMiIsImVtYWlsIjoiYWJhc3NyZW1pbGVrdW5AZ21haWwuY29tIiwicm9sZSI6InN0dWRlbnQiLCJpYXQiOjE3NDcxNTc0NjAsImV4cCI6MTc0Nzc2MjI2MH0.OXCE3ElhWLyz_u8iP-bI02205VikaJDYjvviIVeAaM4	2025-05-13 18:31:00.648216
61	335338da-82c6-4a74-985d-700c5f63e835	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjMzNTMzOGRhLTgyYzYtNGE3NC05ODVkLTcwMGM1ZjYzZTgzNSIsImVtYWlsIjoiYWJhc3NyZW1pbGVrdW4xQGdtYWlsLmNvbSIsInJvbGUiOiJpbnN0cnVjdG9yIiwiaWF0IjoxNzQ3MTU3NTk3LCJleHAiOjE3NDc3NjIzOTd9.8SOfjeejpBGSv7wxC2KjkmFIFCfOwOTxLsRdL3or3xM	2025-05-13 18:33:17.147911
62	984f1a8b-083b-4678-bf9d-f89f4b50f937	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijk4NGYxYThiLTA4M2ItNDY3OC1iZjlkLWY4OWY0YjUwZjkzNyIsImVtYWlsIjoicmVtaUBnbWFpbC5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NDcxNTc2OTksImV4cCI6MTc0Nzc2MjQ5OX0.w00w4M5da9q_Ef-uo08-EOfFPwHt83jbOT-ZGSZRAkM	2025-05-13 18:34:59.098658
63	335338da-82c6-4a74-985d-700c5f63e835	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjMzNTMzOGRhLTgyYzYtNGE3NC05ODVkLTcwMGM1ZjYzZTgzNSIsImVtYWlsIjoiYWJhc3NyZW1pbGVrdW4xQGdtYWlsLmNvbSIsInJvbGUiOiJpbnN0cnVjdG9yIiwiaWF0IjoxNzQ3MTU3ODc3LCJleHAiOjE3NDc3NjI2Nzd9.DGMk9RGGh3Pit2i_KeSiAjCHm8NRZV8MI9fu096TsPo	2025-05-13 18:37:57.225863
64	fd021f7e-9b23-4866-8888-e0fa7b41c0b2	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImZkMDIxZjdlLTliMjMtNDg2Ni04ODg4LWUwZmE3YjQxYzBiMiIsImVtYWlsIjoiYWJhc3NyZW1pbGVrdW5AZ21haWwuY29tIiwicm9sZSI6InN0dWRlbnQiLCJpYXQiOjE3NDcxNTc5NTgsImV4cCI6MTc0Nzc2Mjc1OH0.tYBcSNQOU1nuAMSq21XrPZANDstIxaao7p38AK1_re8	2025-05-13 18:39:18.552638
65	057c8841-5ac5-479a-9b0a-91abbd67866a	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjA1N2M4ODQxLTVhYzUtNDc5YS05YjBhLTkxYWJiZDY3ODY2YSIsImVtYWlsIjoidmVyb3R1dG9yQGdtYWlsLmNvbSIsInJvbGUiOiJpbnN0cnVjdG9yIiwiaWF0IjoxNzQ3MTU4MDUyLCJleHAiOjE3NDc3NjI4NTJ9.mtVChkwRRlzmc8AEcuAW6GKWKml9N3qEt56_0CdALGk	2025-05-13 18:40:52.760438
66	379c438a-0a5d-46a0-ba22-2d59ac4310ee	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjM3OWM0MzhhLTBhNWQtNDZhMC1iYTIyLTJkNTlhYzQzMTBlZSIsImVtYWlsIjoib2Z1b2t3dXZlcm9uaWNhMzdAZ21haWwuY29tIiwicm9sZSI6InN0dWRlbnQiLCJpYXQiOjE3NDcxNTgxMDYsImV4cCI6MTc0Nzc2MjkwNn0.g37NjrBr7b3Sc_oh9-t-hNpbhbL1lkq7PWomJPBXbEg	2025-05-13 18:41:46.93834
67	379c438a-0a5d-46a0-ba22-2d59ac4310ee	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjM3OWM0MzhhLTBhNWQtNDZhMC1iYTIyLTJkNTlhYzQzMTBlZSIsImVtYWlsIjoib2Z1b2t3dXZlcm9uaWNhMzdAZ21haWwuY29tIiwicm9sZSI6InN0dWRlbnQiLCJpYXQiOjE3NDcxNTkwNTcsImV4cCI6MTc0Nzc2Mzg1N30.k4OTCLVIvRE7oqXCw8RTnqFSW1I9DXM7jFo39uTQ5tY	2025-05-13 18:57:37.308377
68	9fdc638b-08da-4d68-8c3b-fdc58d1db892	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjlmZGM2MzhiLTA4ZGEtNGQ2OC04YzNiLWZkYzU4ZDFkYjg5MiIsImVtYWlsIjoiYWRtaW4yQGdtYWlsLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc0NzE1OTA3MCwiZXhwIjoxNzQ3NzYzODcwfQ.KPqH4r1vDWIeDrSbulF2PA58FwCS4QZK6esCs7ZsOOc	2025-05-13 18:57:50.229054
69	057c8841-5ac5-479a-9b0a-91abbd67866a	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjA1N2M4ODQxLTVhYzUtNDc5YS05YjBhLTkxYWJiZDY3ODY2YSIsImVtYWlsIjoidmVyb3R1dG9yQGdtYWlsLmNvbSIsInJvbGUiOiJpbnN0cnVjdG9yIiwiaWF0IjoxNzQ3MTYwMTUyLCJleHAiOjE3NDc3NjQ5NTJ9.cqWefEkr2fAwFPbKvkQSda5TdyLpQJB5Q9S8SlqK7t8	2025-05-13 19:15:52.644869
70	379c438a-0a5d-46a0-ba22-2d59ac4310ee	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjM3OWM0MzhhLTBhNWQtNDZhMC1iYTIyLTJkNTlhYzQzMTBlZSIsImVtYWlsIjoib2Z1b2t3dXZlcm9uaWNhMzdAZ21haWwuY29tIiwicm9sZSI6InN0dWRlbnQiLCJpYXQiOjE3NDcxNjAyODUsImV4cCI6MTc0Nzc2NTA4NX0.X8AHR4gVyOpsOJ3-4ABI57rfZI-5xYVyC-d08UNyuTk	2025-05-13 19:18:05.457837
71	379c438a-0a5d-46a0-ba22-2d59ac4310ee	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjM3OWM0MzhhLTBhNWQtNDZhMC1iYTIyLTJkNTlhYzQzMTBlZSIsImVtYWlsIjoib2Z1b2t3dXZlcm9uaWNhMzdAZ21haWwuY29tIiwicm9sZSI6InN0dWRlbnQiLCJpYXQiOjE3NDcxNjEyMTQsImV4cCI6MTc0Nzc2NjAxNH0.u1QYFrJNNLNKJxRx-NK4x_gnsMzFFed2kdAvO9K3EwA	2025-05-13 19:33:34.901789
72	f4377572-18fc-4417-9a6b-c1481121bac3	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImY0Mzc3NTcyLTE4ZmMtNDQxNy05YTZiLWMxNDgxMTIxYmFjMyIsImVtYWlsIjoiZmxvcmVuY2VvbnlpMDlAZ21haWwuY29tIiwicm9sZSI6InN0dWRlbnQiLCJpYXQiOjE3NDcyMjIxNzQsImV4cCI6MTc0NzgyNjk3NH0.-D_ufGBDtTDgI17qdmgQTptEIvluZ7Ug9P0t5YsAvF0	2025-05-14 12:29:34.415449
73	f4377572-18fc-4417-9a6b-c1481121bac3	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImY0Mzc3NTcyLTE4ZmMtNDQxNy05YTZiLWMxNDgxMTIxYmFjMyIsImVtYWlsIjoiZmxvcmVuY2VvbnlpMDlAZ21haWwuY29tIiwicm9sZSI6InN0dWRlbnQiLCJpYXQiOjE3NDcyMjIyODYsImV4cCI6MTc0NzgyNzA4Nn0.-YWFRYBbdwgjxMW9Zt5GZENEmIqRZe8e0ULfGUktT8A	2025-05-14 12:31:26.824501
74	f4377572-18fc-4417-9a6b-c1481121bac3	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImY0Mzc3NTcyLTE4ZmMtNDQxNy05YTZiLWMxNDgxMTIxYmFjMyIsImVtYWlsIjoiZmxvcmVuY2VvbnlpMDlAZ21haWwuY29tIiwicm9sZSI6InN0dWRlbnQiLCJpYXQiOjE3NDcyMjIzMTksImV4cCI6MTc0NzgyNzExOX0.nl6piklIEp_fAGYgw_oUWyRZaZmJMRy5g2w8dJxhj2k	2025-05-14 12:31:59.6388
75	f4377572-18fc-4417-9a6b-c1481121bac3	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImY0Mzc3NTcyLTE4ZmMtNDQxNy05YTZiLWMxNDgxMTIxYmFjMyIsImVtYWlsIjoiZmxvcmVuY2VvbnlpMDlAZ21haWwuY29tIiwicm9sZSI6InN0dWRlbnQiLCJpYXQiOjE3NDcyMjIzMzEsImV4cCI6MTc0NzgyNzEzMX0.OUcZGou7j2s10j-4cmP-MgJD2fFTe_7DG2rEAp-eLFU	2025-05-14 12:32:11.690618
76	f4377572-18fc-4417-9a6b-c1481121bac3	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImY0Mzc3NTcyLTE4ZmMtNDQxNy05YTZiLWMxNDgxMTIxYmFjMyIsImVtYWlsIjoiZmxvcmVuY2VvbnlpMDlAZ21haWwuY29tIiwicm9sZSI6InN0dWRlbnQiLCJpYXQiOjE3NDcyMjIzNDgsImV4cCI6MTc0NzgyNzE0OH0.3fhG9ixD5VrDMV4_QUPz4zmmBureD4DD54077bkiFYQ	2025-05-14 12:32:28.76255
77	f4377572-18fc-4417-9a6b-c1481121bac3	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImY0Mzc3NTcyLTE4ZmMtNDQxNy05YTZiLWMxNDgxMTIxYmFjMyIsImVtYWlsIjoiZmxvcmVuY2VvbnlpMDlAZ21haWwuY29tIiwicm9sZSI6InN0dWRlbnQiLCJpYXQiOjE3NDcyMjIzODYsImV4cCI6MTc0NzgyNzE4Nn0.GF_Gapz5ZdzYDAKn45glX_8EvB6UbZ5w5UyTpexl4x8	2025-05-14 12:33:06.800964
78	f4377572-18fc-4417-9a6b-c1481121bac3	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImY0Mzc3NTcyLTE4ZmMtNDQxNy05YTZiLWMxNDgxMTIxYmFjMyIsImVtYWlsIjoiZmxvcmVuY2VvbnlpMDlAZ21haWwuY29tIiwicm9sZSI6InN0dWRlbnQiLCJpYXQiOjE3NDcyMjI1MDYsImV4cCI6MTc0NzgyNzMwNn0.Hd49eNnoPYjdc4wTDhpeYmVQD9NXvpjsDSyVLZsZjsg	2025-05-14 12:35:06.07059
79	f4377572-18fc-4417-9a6b-c1481121bac3	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImY0Mzc3NTcyLTE4ZmMtNDQxNy05YTZiLWMxNDgxMTIxYmFjMyIsImVtYWlsIjoiZmxvcmVuY2VvbnlpMDlAZ21haWwuY29tIiwicm9sZSI6InN0dWRlbnQiLCJpYXQiOjE3NDcyMjI1MjAsImV4cCI6MTc0NzgyNzMyMH0.3cgbfszEJgk18-bPNaLOzdGMalGcQQjG_5RMf3OTBBU	2025-05-14 12:35:20.379305
80	f4377572-18fc-4417-9a6b-c1481121bac3	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImY0Mzc3NTcyLTE4ZmMtNDQxNy05YTZiLWMxNDgxMTIxYmFjMyIsImVtYWlsIjoiZmxvcmVuY2VvbnlpMDlAZ21haWwuY29tIiwicm9sZSI6InN0dWRlbnQiLCJpYXQiOjE3NDcyMjI2MzYsImV4cCI6MTc0NzgyNzQzNn0.-qwUk1KiacO-W5XLGixZj-KhOM4p7cRmAgpvqbP17YI	2025-05-14 12:37:16.503053
81	f4377572-18fc-4417-9a6b-c1481121bac3	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImY0Mzc3NTcyLTE4ZmMtNDQxNy05YTZiLWMxNDgxMTIxYmFjMyIsImVtYWlsIjoiZmxvcmVuY2VvbnlpMDlAZ21haWwuY29tIiwicm9sZSI6InN0dWRlbnQiLCJpYXQiOjE3NDcyMjM0NDcsImV4cCI6MTc0NzgyODI0N30.PYjYWa8RQjMcJHOwY1E7knzAzQf-d39IBsOVjpPFk4c	2025-05-14 12:50:47.055677
82	f4377572-18fc-4417-9a6b-c1481121bac3	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImY0Mzc3NTcyLTE4ZmMtNDQxNy05YTZiLWMxNDgxMTIxYmFjMyIsImVtYWlsIjoiZmxvcmVuY2VvbnlpMDlAZ21haWwuY29tIiwicm9sZSI6InN0dWRlbnQiLCJpYXQiOjE3NDcyMjM0OTksImV4cCI6MTc0NzgyODI5OX0.gkXdYHSo7hc1bfNst6UppV1cf6iHd5Sw6qZ56NmKA8s	2025-05-14 12:51:39.60828
83	f4377572-18fc-4417-9a6b-c1481121bac3	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImY0Mzc3NTcyLTE4ZmMtNDQxNy05YTZiLWMxNDgxMTIxYmFjMyIsImVtYWlsIjoiZmxvcmVuY2VvbnlpMDlAZ21haWwuY29tIiwicm9sZSI6InN0dWRlbnQiLCJpYXQiOjE3NDcyMjM5NTgsImV4cCI6MTc0NzgyODc1OH0.rzV8RehdMAaHoXW6o09WGsHNtYZ8JjZ8LEQYUB-LJXU	2025-05-14 12:59:18.845489
84	f4377572-18fc-4417-9a6b-c1481121bac3	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImY0Mzc3NTcyLTE4ZmMtNDQxNy05YTZiLWMxNDgxMTIxYmFjMyIsImVtYWlsIjoiZmxvcmVuY2VvbnlpMDlAZ21haWwuY29tIiwicm9sZSI6InN0dWRlbnQiLCJpYXQiOjE3NDcyMjM5ODcsImV4cCI6MTc0NzgyODc4N30.J3Cool8sxgnOsQLalcN7tfU_7Yx39kvFXMVxkq4wOeE	2025-05-14 12:59:47.318916
85	f4377572-18fc-4417-9a6b-c1481121bac3	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImY0Mzc3NTcyLTE4ZmMtNDQxNy05YTZiLWMxNDgxMTIxYmFjMyIsImVtYWlsIjoiZmxvcmVuY2VvbnlpMDlAZ21haWwuY29tIiwicm9sZSI6InN0dWRlbnQiLCJpYXQiOjE3NDcyMjQyOTcsImV4cCI6MTc0NzgyOTA5N30.tqWbzFRU1zuFEkSHKiRhOor8JCBfstYqlhHu9iKWEZ4	2025-05-14 13:04:57.828593
86	f4377572-18fc-4417-9a6b-c1481121bac3	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImY0Mzc3NTcyLTE4ZmMtNDQxNy05YTZiLWMxNDgxMTIxYmFjMyIsImVtYWlsIjoiZmxvcmVuY2VvbnlpMDlAZ21haWwuY29tIiwicm9sZSI6InN0dWRlbnQiLCJpYXQiOjE3NDcyMjQzMTMsImV4cCI6MTc0NzgyOTExM30.IZ0mFYsniodN9MJxrQboMpD3PZSmhgjoQugp3D7VprE	2025-05-14 13:05:13.813241
87	379c438a-0a5d-46a0-ba22-2d59ac4310ee	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjM3OWM0MzhhLTBhNWQtNDZhMC1iYTIyLTJkNTlhYzQzMTBlZSIsImVtYWlsIjoib2Z1b2t3dXZlcm9uaWNhMzdAZ21haWwuY29tIiwicm9sZSI6InN0dWRlbnQiLCJpYXQiOjE3NDcyMjQzNTcsImV4cCI6MTc0NzgyOTE1N30.7ZiP-qSy4dzIGlmL0LoWg6olVT6sYOkFitE_rPn0IOY	2025-05-14 13:05:57.921688
88	f4377572-18fc-4417-9a6b-c1481121bac3	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImY0Mzc3NTcyLTE4ZmMtNDQxNy05YTZiLWMxNDgxMTIxYmFjMyIsImVtYWlsIjoiZmxvcmVuY2VvbnlpMDlAZ21haWwuY29tIiwicm9sZSI6InN0dWRlbnQiLCJpYXQiOjE3NDcyMjQ2NDIsImV4cCI6MTc0NzgyOTQ0Mn0.jdcWa3P8apre5OgBbMwPVOfpZV5ms_qXt2Xs9ik7tLw	2025-05-14 13:10:42.028293
89	f4377572-18fc-4417-9a6b-c1481121bac3	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImY0Mzc3NTcyLTE4ZmMtNDQxNy05YTZiLWMxNDgxMTIxYmFjMyIsImVtYWlsIjoiZmxvcmVuY2VvbnlpMDlAZ21haWwuY29tIiwicm9sZSI6InN0dWRlbnQiLCJpYXQiOjE3NDcyMjUzNzAsImV4cCI6MTc0NzgzMDE3MH0.5VfjKmSCcFAvEsFvj9fBYuUY5SFw5f9aOrudbE8e6J8	2025-05-14 13:22:50.813173
90	f4377572-18fc-4417-9a6b-c1481121bac3	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImY0Mzc3NTcyLTE4ZmMtNDQxNy05YTZiLWMxNDgxMTIxYmFjMyIsImVtYWlsIjoiZmxvcmVuY2VvbnlpMDlAZ21haWwuY29tIiwicm9sZSI6InN0dWRlbnQiLCJpYXQiOjE3NDcyMjUzNzksImV4cCI6MTc0NzgzMDE3OX0.MgeMVO4o6Jf3kt0TQzpdMibUoW2DDw_TfWuOIhi1jwg	2025-05-14 13:22:59.473433
91	f4377572-18fc-4417-9a6b-c1481121bac3	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImY0Mzc3NTcyLTE4ZmMtNDQxNy05YTZiLWMxNDgxMTIxYmFjMyIsImVtYWlsIjoiZmxvcmVuY2VvbnlpMDlAZ21haWwuY29tIiwicm9sZSI6InN0dWRlbnQiLCJpYXQiOjE3NDcyMjU0MDAsImV4cCI6MTc0NzgzMDIwMH0.detYGClkmUapmCT45jP-1QtYqTfr0kxsnPPWFuubtXw	2025-05-14 13:23:20.243215
92	f4377572-18fc-4417-9a6b-c1481121bac3	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImY0Mzc3NTcyLTE4ZmMtNDQxNy05YTZiLWMxNDgxMTIxYmFjMyIsImVtYWlsIjoiZmxvcmVuY2VvbnlpMDlAZ21haWwuY29tIiwicm9sZSI6InN0dWRlbnQiLCJpYXQiOjE3NDcyMjU4MTIsImV4cCI6MTc0NzgzMDYxMn0.e_aX79ckL-Mh3178LosD1YGA8c5DLPObzg52P29_bFc	2025-05-14 13:30:12.988441
93	f4377572-18fc-4417-9a6b-c1481121bac3	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImY0Mzc3NTcyLTE4ZmMtNDQxNy05YTZiLWMxNDgxMTIxYmFjMyIsImVtYWlsIjoiZmxvcmVuY2VvbnlpMDlAZ21haWwuY29tIiwicm9sZSI6InN0dWRlbnQiLCJpYXQiOjE3NDcyMjU4MTUsImV4cCI6MTc0NzgzMDYxNX0.tBUEtnUdcsNheTOtiK4lZh9LExBYNwBzitu2foRin3Q	2025-05-14 13:30:15.692502
94	f4377572-18fc-4417-9a6b-c1481121bac3	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImY0Mzc3NTcyLTE4ZmMtNDQxNy05YTZiLWMxNDgxMTIxYmFjMyIsImVtYWlsIjoiZmxvcmVuY2VvbnlpMDlAZ21haWwuY29tIiwicm9sZSI6InN0dWRlbnQiLCJpYXQiOjE3NDcyMjU4MjMsImV4cCI6MTc0NzgzMDYyM30.clKQYC2wUBkmwX6YSdl9iyQm4JnskfR9y1TI4YBznbc	2025-05-14 13:30:23.753048
95	f4377572-18fc-4417-9a6b-c1481121bac3	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImY0Mzc3NTcyLTE4ZmMtNDQxNy05YTZiLWMxNDgxMTIxYmFjMyIsImVtYWlsIjoiZmxvcmVuY2VvbnlpMDlAZ21haWwuY29tIiwicm9sZSI6InN0dWRlbnQiLCJpYXQiOjE3NDcyMjU5MjgsImV4cCI6MTc0NzgzMDcyOH0.p7UIGhDTAAnsVomNYDxaQoGgeeMkwIn7dC2_sDA-6j8	2025-05-14 13:32:08.346025
96	411b3d5d-bc3c-44e6-91e5-c7b24967824d	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjQxMWIzZDVkLWJjM2MtNDRlNi05MWU1LWM3YjI0OTY3ODI0ZCIsImVtYWlsIjoidmVyYWZyYWdvbjIuMEBnbWFpbC5jb20iLCJyb2xlIjoic3R1ZGVudCIsImlhdCI6MTc0NzIyNjA1OCwiZXhwIjoxNzQ3ODMwODU4fQ.eU5hSsJOdUP54NrMmbauf_VQ-_edYlCZFU6dYeFjhKI	2025-05-14 13:34:18.955674
\.


--
-- TOC entry 5150 (class 0 OID 19118)
-- Dependencies: 237
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reviews (id, student_id, course_id, rating, comment, created_at) FROM stdin;
\.


--
-- TOC entry 5148 (class 0 OID 19078)
-- Dependencies: 235
-- Data for Name: student_courses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.student_courses (id, student_id, course_id, created_at) FROM stdin;
\.


--
-- TOC entry 5132 (class 0 OID 18779)
-- Dependencies: 219
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, email, password_hash, role, created_at, bio, expertise, oauth_provider, oauth_id) FROM stdin;
f4377572-18fc-4417-9a6b-c1481121bac3	florence	florenceonyi09@gmail.com	$2a$10$hU54kKcnx.HSnDcyVg9SLug0usXpQk/TBiSHR2E.UIrctBjTlxbLO	student	2025-04-23 09:41:32.955985	\N	\N	\N	\N
b4c5d4c5-837d-47e6-842d-d150a95b3df0	Test Student	student@test.com	$2a$10$f/KoNm4djfnd9dIQLMN3gusdj3U/z1hv8ASuZPZXr/z8Hse8Ci72a	student	2025-04-23 11:52:35.93562	\N	\N	\N	\N
4c53fbb1-9065-4f59-b421-7440c7ee892f	Test Admin	admin@test.com	$2a$10$6P8uLOlz9yJuyWyha39ka.4oQgwHBHNHEWjcUIV9vbmA4FogerTgm	admin	2025-04-23 11:53:53.64757	\N	\N	\N	\N
379c438a-0a5d-46a0-ba22-2d59ac4310ee	veronica peter	ofuokwuveronica37@gmail.com	$2a$10$LC7Q3br8M1iuTFDqZ0W.ReTHgjHGpJeefwfYiQZ8j11e4YSZbCsjq	student	2025-04-24 08:49:37.226177	\N	\N	\N	\N
d8086600-6a5d-4fa0-a480-68d87cb9380b	tutor	tutor@gmail.com	$2a$10$wyNOO/HIjw1ruO604CUIney/vczHZwSuNy7lN1DZJiJE6uHi3rcS.	student	2025-04-24 09:28:39.821512	\N	\N	\N	\N
ff6fb9d1-3620-42bb-84fc-21a726cdc803	admin	admin@gmail.com	$2a$10$6mUYPRKuYiUmGS5MEhGhn.HM2P3fAVCkJPHWYliBLfA9Jd8wOA0Ym	admin	2025-04-24 11:02:32.992302	\N	\N	\N	\N
eedaddcd-120e-4c71-b613-12377a9da3c7	moffat victor	mvsc@gmail.com	$2a$10$nok7JDS0gz8ogpRvZmhfm.0olF3hQXTxlGenXkHi1TbfTGqUTI/cW	student	2025-04-24 14:35:26.32997	\N	\N	\N	\N
29ef7a83-26a3-4848-a585-d4f4dfcd02ff	Test Student	student@test2.com	$2a$10$q2T9S7S5XAznQLtIm45C8uhj67podMNayeXOc3MwNl62nb.VhQbgq	student	2025-04-25 11:22:56.523345	\N	\N	\N	\N
877a0ace-a016-4786-b2c5-e7e8313a0d86	Test Instructor	instructor234567@test.com	$2a$10$PW1cBH0f3guq2WIrble8h./j/NNUQrhlh9Fp.0.aV4YzAQuE.aCee	instructor	2025-04-25 11:24:11.758429	\N	\N	\N	\N
4e37d3c8-534c-4900-ad40-08aebcc13e49	Test Admin	admin2@test.com	$2a$10$zvOYsI2rBcLJQ.NV2UBQJ.veXhXteZDQuK1ps/WwDz22cG3VYGFja	admin	2025-04-25 11:24:55.944225	\N	\N	\N	\N
37b835e0-dd9e-4fed-b534-c8f5c1ecc4ef	Infinite MasterMind	Wizardking2125@gmail.com	$2a$10$Iw6CnSN0XkQcA2kqU2IupeI5.hgdfA3cedWfov4FAwikxyDJ6Mn8i	student	2025-04-25 13:10:29.861917	\N	\N	\N	\N
f6502877-92c9-44e1-aee8-b88f3a37a8c1	genexis victory	victoryazudoni@gmail.com	$2a$10$XfZZBo5HCYPbfuqGxETaYeSlkuBpgSufdpgPRFRFE6R02uuJBpouW	student	2025-04-25 15:34:29.123536	\N	\N	\N	\N
9fdc638b-08da-4d68-8c3b-fdc58d1db892	admin2	admin2@gmail.com	$2a$10$ZwzIQrUlpPN1J2Q5Cio.LOgcbqt1wamzsgv1BMt2S5h4A9OB1zNSu	admin	2025-05-09 13:35:13.290583	\N	\N	\N	\N
057c8841-5ac5-479a-9b0a-91abbd67866a	verotutor	verotutor@gmail.com	$2a$10$Z/C0Uwak8Rhr2WVQOA9VhuRKaXhsOZq0PH0V0y.Ekcf86tpo.qQ7.	instructor	2025-05-13 12:23:39.047918	\N	\N	\N	\N
fd021f7e-9b23-4866-8888-e0fa7b41c0b2	Sorinade Abass Remilekun	abassremilekun@gmail.com	$2a$10$McvXqFlTbajnKFXwR8T2KOYJZ6sigzkAg4dKziImPuLtu1Tas/Tze	student	2025-05-13 18:25:28.50627	\N	\N	\N	\N
335338da-82c6-4a74-985d-700c5f63e835	Remi fuckalistic	abassremilekun1@gmail.com	$2a$10$9C8wEOB5RuBD.92wCiWH8.v2KrLSQw1OPvDRa2Wd1rrSrI0hmTX/q	instructor	2025-05-13 18:32:40.518774	\N	\N	\N	\N
984f1a8b-083b-4678-bf9d-f89f4b50f937	remi	remi@gmail.com	$2a$10$WkjgfVnVXGXu8nLLPwl8he.7re99pgG6y7RnGrdkFrCQ4GvJXQlx2	admin	2025-05-13 18:34:43.698042	\N	\N	\N	\N
411b3d5d-bc3c-44e6-91e5-c7b24967824d	Florence Veronica Peter Ofuokwu	verafragon2.0@gmail.com	\N	student	2025-05-14 13:34:18.926358	\N	\N	google	114432222410043869634
\.


--
-- TOC entry 5161 (class 0 OID 0)
-- Dependencies: 238
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.refresh_tokens_id_seq', 96, true);


--
-- TOC entry 4924 (class 2606 OID 18977)
-- Name: assessment_attempts assessment_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_attempts
    ADD CONSTRAINT assessment_attempts_pkey PRIMARY KEY (id);


--
-- TOC entry 4922 (class 2606 OID 18964)
-- Name: assessments assessments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessments
    ADD CONSTRAINT assessments_pkey PRIMARY KEY (id);


--
-- TOC entry 4927 (class 2606 OID 18996)
-- Name: certificates certificates_certificate_id_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_certificate_id_unique UNIQUE (certificate_id);


--
-- TOC entry 4929 (class 2606 OID 18994)
-- Name: certificates certificates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_pkey PRIMARY KEY (id);


--
-- TOC entry 4903 (class 2606 OID 18872)
-- Name: course_completions course_completions_certificate_id_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_completions
    ADD CONSTRAINT course_completions_certificate_id_unique UNIQUE (certificate_id);


--
-- TOC entry 4905 (class 2606 OID 18868)
-- Name: course_completions course_completions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_completions
    ADD CONSTRAINT course_completions_pkey PRIMARY KEY (id);


--
-- TOC entry 4907 (class 2606 OID 18870)
-- Name: course_completions course_completions_user_course_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_completions
    ADD CONSTRAINT course_completions_user_course_unique UNIQUE (user_id, course_id);


--
-- TOC entry 4939 (class 2606 OID 19072)
-- Name: course_content course_content_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_content
    ADD CONSTRAINT course_content_pkey PRIMARY KEY (id);


--
-- TOC entry 4945 (class 2606 OID 19105)
-- Name: course_purchases course_purchases_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_purchases
    ADD CONSTRAINT course_purchases_pkey PRIMARY KEY (id);


--
-- TOC entry 4947 (class 2606 OID 19107)
-- Name: course_purchases course_purchases_student_id_course_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_purchases
    ADD CONSTRAINT course_purchases_student_id_course_id_key UNIQUE (student_id, course_id);


--
-- TOC entry 4914 (class 2606 OID 18907)
-- Name: course_submissions course_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_submissions
    ADD CONSTRAINT course_submissions_pkey PRIMARY KEY (id);


--
-- TOC entry 4891 (class 2606 OID 18805)
-- Name: courses courses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_pkey PRIMARY KEY (id);


--
-- TOC entry 4916 (class 2606 OID 18924)
-- Name: discussion_forums discussion_forums_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.discussion_forums
    ADD CONSTRAINT discussion_forums_pkey PRIMARY KEY (id);


--
-- TOC entry 4918 (class 2606 OID 18938)
-- Name: discussion_posts discussion_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.discussion_posts
    ADD CONSTRAINT discussion_posts_pkey PRIMARY KEY (id);


--
-- TOC entry 4896 (class 2606 OID 18833)
-- Name: ebooks ebooks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ebooks
    ADD CONSTRAINT ebooks_pkey PRIMARY KEY (id);


--
-- TOC entry 4898 (class 2606 OID 18848)
-- Name: enrollments enrollments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_pkey PRIMARY KEY (id);


--
-- TOC entry 4900 (class 2606 OID 18850)
-- Name: enrollments enrollments_user_course_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_user_course_unique UNIQUE (user_id, course_id);


--
-- TOC entry 4910 (class 2606 OID 18891)
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- TOC entry 4937 (class 2606 OID 19043)
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- TOC entry 4932 (class 2606 OID 19017)
-- Name: payments payments_paystack_reference_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_paystack_reference_unique UNIQUE (paystack_reference);


--
-- TOC entry 4934 (class 2606 OID 19015)
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- TOC entry 4894 (class 2606 OID 18819)
-- Name: prerecorded_videos prerecorded_videos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prerecorded_videos
    ADD CONSTRAINT prerecorded_videos_pkey PRIMARY KEY (id);


--
-- TOC entry 4953 (class 2606 OID 19169)
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- TOC entry 4949 (class 2606 OID 19127)
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- TOC entry 4951 (class 2606 OID 19129)
-- Name: reviews reviews_student_id_course_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_student_id_course_id_key UNIQUE (student_id, course_id);


--
-- TOC entry 4941 (class 2606 OID 19084)
-- Name: student_courses student_courses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_courses
    ADD CONSTRAINT student_courses_pkey PRIMARY KEY (id);


--
-- TOC entry 4943 (class 2606 OID 19086)
-- Name: student_courses student_courses_student_id_course_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_courses
    ADD CONSTRAINT student_courses_student_id_course_id_key UNIQUE (student_id, course_id);


--
-- TOC entry 4887 (class 2606 OID 18792)
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- TOC entry 4889 (class 2606 OID 18790)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4925 (class 1259 OID 19058)
-- Name: idx_assessment_attempts_user_assessment; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_assessment_attempts_user_assessment ON public.assessment_attempts USING btree (user_id, assessment_id);


--
-- TOC entry 4908 (class 1259 OID 19053)
-- Name: idx_course_completions_user_course; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_course_completions_user_course ON public.course_completions USING btree (user_id, course_id);


--
-- TOC entry 4892 (class 1259 OID 19059)
-- Name: idx_courses_instructor_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_courses_instructor_id ON public.courses USING btree (instructor_id);


--
-- TOC entry 4919 (class 1259 OID 19056)
-- Name: idx_discussion_posts_forum_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_discussion_posts_forum_id ON public.discussion_posts USING btree (forum_id);


--
-- TOC entry 4920 (class 1259 OID 19057)
-- Name: idx_discussion_posts_parent_post; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_discussion_posts_parent_post ON public.discussion_posts USING btree (parent_post_id);


--
-- TOC entry 4901 (class 1259 OID 19052)
-- Name: idx_enrollments_user_course; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_enrollments_user_course ON public.enrollments USING btree (user_id, course_id);


--
-- TOC entry 4911 (class 1259 OID 19054)
-- Name: idx_events_course_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_events_course_id ON public.events USING btree (course_id);


--
-- TOC entry 4912 (class 1259 OID 19055)
-- Name: idx_events_google_calendar; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_events_google_calendar ON public.events USING btree (google_calendar_event_id);


--
-- TOC entry 4935 (class 1259 OID 19061)
-- Name: idx_notifications_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id);


--
-- TOC entry 4930 (class 1259 OID 19060)
-- Name: idx_payments_enrollment_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payments_enrollment_id ON public.payments USING btree (enrollment_id);


--
-- TOC entry 4885 (class 1259 OID 19051)
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- TOC entry 4985 (class 2620 OID 19049)
-- Name: certificates certificate_id_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER certificate_id_trigger BEFORE INSERT ON public.certificates FOR EACH ROW WHEN ((new.certificate_id IS NULL)) EXECUTE FUNCTION public.generate_certificate_id();


--
-- TOC entry 4986 (class 2620 OID 19050)
-- Name: certificates certificate_url_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER certificate_url_trigger BEFORE INSERT ON public.certificates FOR EACH ROW EXECUTE FUNCTION public.set_certificate_url();


--
-- TOC entry 4969 (class 2606 OID 18978)
-- Name: assessment_attempts assessment_attempts_assessment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_attempts
    ADD CONSTRAINT assessment_attempts_assessment_id_fkey FOREIGN KEY (assessment_id) REFERENCES public.assessments(id) ON DELETE CASCADE;


--
-- TOC entry 4970 (class 2606 OID 18983)
-- Name: assessment_attempts assessment_attempts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessment_attempts
    ADD CONSTRAINT assessment_attempts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4968 (class 2606 OID 18965)
-- Name: assessments assessments_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assessments
    ADD CONSTRAINT assessments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- TOC entry 4971 (class 2606 OID 19002)
-- Name: certificates certificates_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- TOC entry 4972 (class 2606 OID 18997)
-- Name: certificates certificates_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4959 (class 2606 OID 18878)
-- Name: course_completions course_completions_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_completions
    ADD CONSTRAINT course_completions_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- TOC entry 4960 (class 2606 OID 18873)
-- Name: course_completions course_completions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_completions
    ADD CONSTRAINT course_completions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4977 (class 2606 OID 19073)
-- Name: course_content course_content_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_content
    ADD CONSTRAINT course_content_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- TOC entry 4980 (class 2606 OID 19113)
-- Name: course_purchases course_purchases_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_purchases
    ADD CONSTRAINT course_purchases_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- TOC entry 4981 (class 2606 OID 19108)
-- Name: course_purchases course_purchases_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_purchases
    ADD CONSTRAINT course_purchases_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4962 (class 2606 OID 18908)
-- Name: course_submissions course_submissions_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_submissions
    ADD CONSTRAINT course_submissions_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- TOC entry 4963 (class 2606 OID 18913)
-- Name: course_submissions course_submissions_instructor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_submissions
    ADD CONSTRAINT course_submissions_instructor_id_fkey FOREIGN KEY (instructor_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4954 (class 2606 OID 18806)
-- Name: courses courses_instructor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_instructor_id_fkey FOREIGN KEY (instructor_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 4964 (class 2606 OID 18925)
-- Name: discussion_forums discussion_forums_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.discussion_forums
    ADD CONSTRAINT discussion_forums_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- TOC entry 4965 (class 2606 OID 18939)
-- Name: discussion_posts discussion_posts_forum_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.discussion_posts
    ADD CONSTRAINT discussion_posts_forum_id_fkey FOREIGN KEY (forum_id) REFERENCES public.discussion_forums(id) ON DELETE CASCADE;


--
-- TOC entry 4966 (class 2606 OID 18949)
-- Name: discussion_posts discussion_posts_parent_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.discussion_posts
    ADD CONSTRAINT discussion_posts_parent_post_id_fkey FOREIGN KEY (parent_post_id) REFERENCES public.discussion_posts(id) ON DELETE CASCADE;


--
-- TOC entry 4967 (class 2606 OID 18944)
-- Name: discussion_posts discussion_posts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.discussion_posts
    ADD CONSTRAINT discussion_posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4956 (class 2606 OID 18834)
-- Name: ebooks ebooks_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ebooks
    ADD CONSTRAINT ebooks_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- TOC entry 4957 (class 2606 OID 18856)
-- Name: enrollments enrollments_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- TOC entry 4958 (class 2606 OID 18851)
-- Name: enrollments enrollments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4961 (class 2606 OID 18892)
-- Name: events events_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- TOC entry 4976 (class 2606 OID 19044)
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4973 (class 2606 OID 19023)
-- Name: payments payments_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- TOC entry 4974 (class 2606 OID 19028)
-- Name: payments payments_enrollment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_enrollment_id_fkey FOREIGN KEY (enrollment_id) REFERENCES public.enrollments(id) ON DELETE CASCADE;


--
-- TOC entry 4975 (class 2606 OID 19018)
-- Name: payments payments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4955 (class 2606 OID 18820)
-- Name: prerecorded_videos prerecorded_videos_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prerecorded_videos
    ADD CONSTRAINT prerecorded_videos_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- TOC entry 4984 (class 2606 OID 19170)
-- Name: refresh_tokens refresh_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4982 (class 2606 OID 19135)
-- Name: reviews reviews_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- TOC entry 4983 (class 2606 OID 19130)
-- Name: reviews reviews_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4978 (class 2606 OID 19092)
-- Name: student_courses student_courses_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_courses
    ADD CONSTRAINT student_courses_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- TOC entry 4979 (class 2606 OID 19087)
-- Name: student_courses student_courses_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_courses
    ADD CONSTRAINT student_courses_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE CASCADE;


-- Completed on 2025-05-14 14:14:16

--
-- PostgreSQL database dump complete
--

