import {integer,sqliteTable,text,primaryKey,index} from 'drizzle-orm/sqlite-core';

// Legacy account tables are retained for historical data until a separate retention/migration decision.
export const profiles=sqliteTable('profiles',{id:text('id').primaryKey(),username:text('username').notNull(),createdAt:integer('created_at').notNull()});
export const stats=sqliteTable('stats',{userId:text('user_id').notNull(),mode:text('mode').notNull(),best:integer('best').notNull().default(0),games:integer('games').notNull().default(0),total:integer('total').notNull().default(0),recordAt:integer('record_at').notNull(),lastPlayed:integer('last_played').notNull()},t=>[primaryKey({columns:[t.userId,t.mode]}),index('leaderboard_idx').on(t.mode,t.best,t.recordAt)]);
export const sessions=sqliteTable('sessions',{id:text('id').primaryKey(),userId:text('user_id').notNull(),mode:text('mode').notNull(),seed:integer('seed').notNull(),started:integer('started').notNull(),consumed:integer('consumed').notNull().default(0)},t=>[index('sessions_user_time').on(t.userId,t.started)]);

export const anonymousSessions=sqliteTable('anonymous_sessions',{
  id:text('id').primaryKey(),
  nickname:text('nickname').notNull(),
  mode:text('mode').notNull(),
  seed:integer('seed').notNull(),
  started:integer('started').notNull(),
  consumed:integer('consumed').notNull().default(0),
},t=>[index('anonymous_sessions_started').on(t.started)]);
export const runs=sqliteTable('runs',{
  id:text('id').primaryKey(),
  nickname:text('nickname').notNull(),
  mode:text('mode').notNull(),
  score:integer('score').notNull(),
  finishedAt:integer('finished_at').notNull()
},t=>[index('runs_leaderboard').on(t.mode,t.score,t.finishedAt)]);
