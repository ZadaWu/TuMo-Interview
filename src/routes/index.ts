import { Application } from 'express';
import { IndexController } from '../controllers/index';

function setRoutes(app: Application): void {
  const indexController = new IndexController();

  app.get('/', indexController.getIndex.bind(indexController));
}

export default setRoutes;