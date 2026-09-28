import express from 'express';
import { errorHandler, ApiError } from './lib/errors.js';
import { rateLimit } from './middleware/rate-limit.js';
import { studentRouter } from './modules/students/student.routes.js';
import { subjectRouter } from './modules/subjects/subject.routes.js';
import { studyGroupRouter } from './modules/study-groups/study-group.routes.js';
import { sessionRouter } from './modules/sessions/session.routes.js';
import { bookingRouter } from './modules/bookings/booking.routes.js';

export const app = express();
app.set('trust proxy', true);
app.use(express.json());
app.use(rateLimit);

app.use('/api/v1/students', studentRouter);
app.use('/api/v1/subjects', subjectRouter);
app.use('/api/v1/study-groups', studyGroupRouter);
app.use('/api/v1/sessions', sessionRouter);
app.use('/api/v1/bookings', bookingRouter);

app.use((_request, _response, next) => next(new ApiError(404, 'NOT_FOUND', 'Route not found.')));
app.use(errorHandler);
