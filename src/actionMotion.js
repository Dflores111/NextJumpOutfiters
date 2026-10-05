import {P} from './routes.js';

// Conversion actions share one visual emphasis; ordinary navigation stays quieter.
export function actionMotionProps(to) {
  return to === '#start-project' || typeof to === 'string' && to.split('?')[0] === P.quote
    ? {'data-priority': 'quote', 'data-ambient': ''}
    : {};
}
