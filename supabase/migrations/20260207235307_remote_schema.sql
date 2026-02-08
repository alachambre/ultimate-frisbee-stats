


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."competitionstatusenum" AS ENUM (
    'ongoing',
    'completed'
);


ALTER TYPE "public"."competitionstatusenum" OWNER TO "postgres";


CREATE TYPE "public"."gamestatusenum" AS ENUM (
    'ready',
    'started',
    'ended'
);


ALTER TYPE "public"."gamestatusenum" OWNER TO "postgres";


CREATE TYPE "public"."genderenum" AS ENUM (
    'M',
    'W'
);


ALTER TYPE "public"."genderenum" OWNER TO "postgres";


CREATE TYPE "public"."pointstatusenum" AS ENUM (
    'ready',
    'running',
    'scored',
    'completed'
);


ALTER TYPE "public"."pointstatusenum" OWNER TO "postgres";


CREATE TYPE "public"."strategycategory" AS ENUM (
    'offense',
    'defense'
);


ALTER TYPE "public"."strategycategory" OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."calls" (
    "id" integer NOT NULL,
    "point_id" integer NOT NULL,
    "call_timestamp" timestamp without time zone NOT NULL,
    "resume_timestamp" timestamp without time zone,
    "comments" "text",
    "created_at" timestamp without time zone NOT NULL
);


ALTER TABLE "public"."calls" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."calls_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."calls_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."calls_id_seq" OWNED BY "public"."calls"."id";



CREATE TABLE IF NOT EXISTS "public"."competition_players" (
    "competition_id" integer NOT NULL,
    "player_id" integer NOT NULL
);


ALTER TABLE "public"."competition_players" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."competitions" (
    "id" integer NOT NULL,
    "team_id" integer NOT NULL,
    "name" character varying(100) NOT NULL,
    "description" "text",
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "status" "public"."competitionstatusenum" NOT NULL,
    "created_at" timestamp without time zone NOT NULL
);


ALTER TABLE "public"."competitions" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."competitions_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."competitions_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."competitions_id_seq" OWNED BY "public"."competitions"."id";



CREATE TABLE IF NOT EXISTS "public"."game_players" (
    "game_id" integer NOT NULL,
    "player_id" integer NOT NULL
);


ALTER TABLE "public"."game_players" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."games" (
    "id" integer NOT NULL,
    "competition_id" integer NOT NULL,
    "opponent_name" character varying NOT NULL,
    "date" timestamp without time zone NOT NULL,
    "status" "public"."gamestatusenum" NOT NULL,
    "start_datetime" timestamp without time zone,
    "end_datetime" timestamp without time zone,
    "comments" "text",
    "created_at" timestamp without time zone NOT NULL
);


ALTER TABLE "public"."games" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."games_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."games_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."games_id_seq" OWNED BY "public"."games"."id";



CREATE TABLE IF NOT EXISTS "public"."line_players" (
    "line_id" integer NOT NULL,
    "player_id" integer NOT NULL
);


ALTER TABLE "public"."line_players" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lines" (
    "id" integer NOT NULL,
    "team_id" integer NOT NULL,
    "name" character varying(100) NOT NULL,
    "description" "text",
    "created_at" timestamp without time zone NOT NULL
);


ALTER TABLE "public"."lines" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."lines_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."lines_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."lines_id_seq" OWNED BY "public"."lines"."id";



CREATE TABLE IF NOT EXISTS "public"."players" (
    "id" integer NOT NULL,
    "team_id" integer NOT NULL,
    "name" character varying NOT NULL,
    "number" integer,
    "gender" "public"."genderenum" NOT NULL,
    "created_at" timestamp without time zone NOT NULL
);


ALTER TABLE "public"."players" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."players_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."players_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."players_id_seq" OWNED BY "public"."players"."id";



CREATE TABLE IF NOT EXISTS "public"."point_players" (
    "point_id" integer NOT NULL,
    "player_id" integer NOT NULL
);


ALTER TABLE "public"."point_players" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."points" (
    "id" integer NOT NULL,
    "game_id" integer NOT NULL,
    "point_number" integer NOT NULL,
    "starting_on_offense" boolean NOT NULL,
    "won" boolean,
    "status" "public"."pointstatusenum" NOT NULL,
    "field_side" character varying(50),
    "pull" boolean,
    "strategy_id" integer,
    "comments" "text",
    "start_datetime" timestamp without time zone,
    "end_datetime" timestamp without time zone,
    "created_at" timestamp without time zone NOT NULL
);


ALTER TABLE "public"."points" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."points_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."points_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."points_id_seq" OWNED BY "public"."points"."id";



CREATE TABLE IF NOT EXISTS "public"."strategies" (
    "id" integer NOT NULL,
    "name" character varying(100) NOT NULL,
    "description" "text",
    "category" "public"."strategycategory" NOT NULL,
    "created_at" timestamp without time zone NOT NULL
);


ALTER TABLE "public"."strategies" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."strategies_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."strategies_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."strategies_id_seq" OWNED BY "public"."strategies"."id";



CREATE TABLE IF NOT EXISTS "public"."teams" (
    "id" integer NOT NULL,
    "name" character varying NOT NULL,
    "created_at" timestamp without time zone NOT NULL
);


ALTER TABLE "public"."teams" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."teams_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."teams_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."teams_id_seq" OWNED BY "public"."teams"."id";



CREATE TABLE IF NOT EXISTS "public"."turnovers" (
    "id" integer NOT NULL,
    "point_id" integer NOT NULL,
    "player_id" integer,
    "timestamp" timestamp without time zone NOT NULL,
    "comments" "text",
    "created_at" timestamp without time zone NOT NULL
);


ALTER TABLE "public"."turnovers" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."turnovers_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."turnovers_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."turnovers_id_seq" OWNED BY "public"."turnovers"."id";



ALTER TABLE ONLY "public"."calls" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."calls_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."competitions" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."competitions_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."games" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."games_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."lines" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."lines_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."players" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."players_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."points" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."points_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."strategies" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."strategies_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."teams" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."teams_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."turnovers" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."turnovers_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."calls"
    ADD CONSTRAINT "calls_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."competition_players"
    ADD CONSTRAINT "competition_players_pkey" PRIMARY KEY ("competition_id", "player_id");



ALTER TABLE ONLY "public"."competitions"
    ADD CONSTRAINT "competitions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."game_players"
    ADD CONSTRAINT "game_players_pkey" PRIMARY KEY ("game_id", "player_id");



ALTER TABLE ONLY "public"."games"
    ADD CONSTRAINT "games_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."line_players"
    ADD CONSTRAINT "line_players_pkey" PRIMARY KEY ("line_id", "player_id");



ALTER TABLE ONLY "public"."lines"
    ADD CONSTRAINT "lines_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."players"
    ADD CONSTRAINT "players_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."point_players"
    ADD CONSTRAINT "point_players_pkey" PRIMARY KEY ("point_id", "player_id");



ALTER TABLE ONLY "public"."points"
    ADD CONSTRAINT "points_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."strategies"
    ADD CONSTRAINT "strategies_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."strategies"
    ADD CONSTRAINT "strategies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."turnovers"
    ADD CONSTRAINT "turnovers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lines"
    ADD CONSTRAINT "uq_team_line_name" UNIQUE ("team_id", "name");



CREATE INDEX "ix_calls_id" ON "public"."calls" USING "btree" ("id");



CREATE INDEX "ix_competitions_id" ON "public"."competitions" USING "btree" ("id");



CREATE INDEX "ix_games_id" ON "public"."games" USING "btree" ("id");



CREATE INDEX "ix_lines_id" ON "public"."lines" USING "btree" ("id");



CREATE INDEX "ix_players_id" ON "public"."players" USING "btree" ("id");



CREATE INDEX "ix_points_id" ON "public"."points" USING "btree" ("id");



CREATE INDEX "ix_strategies_id" ON "public"."strategies" USING "btree" ("id");



CREATE INDEX "ix_teams_id" ON "public"."teams" USING "btree" ("id");



CREATE INDEX "ix_turnovers_id" ON "public"."turnovers" USING "btree" ("id");



ALTER TABLE ONLY "public"."calls"
    ADD CONSTRAINT "calls_point_id_fkey" FOREIGN KEY ("point_id") REFERENCES "public"."points"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."competition_players"
    ADD CONSTRAINT "competition_players_competition_id_fkey" FOREIGN KEY ("competition_id") REFERENCES "public"."competitions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."competition_players"
    ADD CONSTRAINT "competition_players_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."competitions"
    ADD CONSTRAINT "competitions_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."game_players"
    ADD CONSTRAINT "game_players_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."game_players"
    ADD CONSTRAINT "game_players_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."games"
    ADD CONSTRAINT "games_competition_id_fkey" FOREIGN KEY ("competition_id") REFERENCES "public"."competitions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."line_players"
    ADD CONSTRAINT "line_players_line_id_fkey" FOREIGN KEY ("line_id") REFERENCES "public"."lines"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."line_players"
    ADD CONSTRAINT "line_players_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lines"
    ADD CONSTRAINT "lines_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."players"
    ADD CONSTRAINT "players_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."point_players"
    ADD CONSTRAINT "point_players_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."point_players"
    ADD CONSTRAINT "point_players_point_id_fkey" FOREIGN KEY ("point_id") REFERENCES "public"."points"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."points"
    ADD CONSTRAINT "points_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."points"
    ADD CONSTRAINT "points_strategy_id_fkey" FOREIGN KEY ("strategy_id") REFERENCES "public"."strategies"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."turnovers"
    ADD CONSTRAINT "turnovers_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."turnovers"
    ADD CONSTRAINT "turnovers_point_id_fkey" FOREIGN KEY ("point_id") REFERENCES "public"."points"("id") ON DELETE CASCADE;





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";








































































































































































GRANT ALL ON TABLE "public"."calls" TO "anon";
GRANT ALL ON TABLE "public"."calls" TO "authenticated";
GRANT ALL ON TABLE "public"."calls" TO "service_role";



GRANT ALL ON SEQUENCE "public"."calls_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."calls_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."calls_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."competition_players" TO "anon";
GRANT ALL ON TABLE "public"."competition_players" TO "authenticated";
GRANT ALL ON TABLE "public"."competition_players" TO "service_role";



GRANT ALL ON TABLE "public"."competitions" TO "anon";
GRANT ALL ON TABLE "public"."competitions" TO "authenticated";
GRANT ALL ON TABLE "public"."competitions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."competitions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."competitions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."competitions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."game_players" TO "anon";
GRANT ALL ON TABLE "public"."game_players" TO "authenticated";
GRANT ALL ON TABLE "public"."game_players" TO "service_role";



GRANT ALL ON TABLE "public"."games" TO "anon";
GRANT ALL ON TABLE "public"."games" TO "authenticated";
GRANT ALL ON TABLE "public"."games" TO "service_role";



GRANT ALL ON SEQUENCE "public"."games_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."games_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."games_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."line_players" TO "anon";
GRANT ALL ON TABLE "public"."line_players" TO "authenticated";
GRANT ALL ON TABLE "public"."line_players" TO "service_role";



GRANT ALL ON TABLE "public"."lines" TO "anon";
GRANT ALL ON TABLE "public"."lines" TO "authenticated";
GRANT ALL ON TABLE "public"."lines" TO "service_role";



GRANT ALL ON SEQUENCE "public"."lines_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."lines_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."lines_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."players" TO "anon";
GRANT ALL ON TABLE "public"."players" TO "authenticated";
GRANT ALL ON TABLE "public"."players" TO "service_role";



GRANT ALL ON SEQUENCE "public"."players_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."players_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."players_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."point_players" TO "anon";
GRANT ALL ON TABLE "public"."point_players" TO "authenticated";
GRANT ALL ON TABLE "public"."point_players" TO "service_role";



GRANT ALL ON TABLE "public"."points" TO "anon";
GRANT ALL ON TABLE "public"."points" TO "authenticated";
GRANT ALL ON TABLE "public"."points" TO "service_role";



GRANT ALL ON SEQUENCE "public"."points_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."points_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."points_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."strategies" TO "anon";
GRANT ALL ON TABLE "public"."strategies" TO "authenticated";
GRANT ALL ON TABLE "public"."strategies" TO "service_role";



GRANT ALL ON SEQUENCE "public"."strategies_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."strategies_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."strategies_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."teams" TO "anon";
GRANT ALL ON TABLE "public"."teams" TO "authenticated";
GRANT ALL ON TABLE "public"."teams" TO "service_role";



GRANT ALL ON SEQUENCE "public"."teams_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."teams_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."teams_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."turnovers" TO "anon";
GRANT ALL ON TABLE "public"."turnovers" TO "authenticated";
GRANT ALL ON TABLE "public"."turnovers" TO "service_role";



GRANT ALL ON SEQUENCE "public"."turnovers_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."turnovers_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."turnovers_id_seq" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































drop extension if exists "pg_net";

CREATE TRIGGER objects_delete_delete_prefix AFTER DELETE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger();

CREATE TRIGGER objects_insert_create_prefix BEFORE INSERT ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.objects_insert_prefix_trigger();

CREATE TRIGGER objects_update_create_prefix BEFORE UPDATE ON storage.objects FOR EACH ROW WHEN (((new.name <> old.name) OR (new.bucket_id <> old.bucket_id))) EXECUTE FUNCTION storage.objects_update_prefix_trigger();

CREATE TRIGGER prefixes_create_hierarchy BEFORE INSERT ON storage.prefixes FOR EACH ROW WHEN ((pg_trigger_depth() < 1)) EXECUTE FUNCTION storage.prefixes_insert_trigger();

CREATE TRIGGER prefixes_delete_hierarchy AFTER DELETE ON storage.prefixes FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger();


