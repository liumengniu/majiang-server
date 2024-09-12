/**
 * @author Kevin
 * @Date: 2024-6-18
 */

const router = require('koa-router')();

const user = require('./user');
const room = require('./room');

router.use('/user', user.routes(), user.allowedMethods());
router.use('/room', room.routes(), room.allowedMethods());

module.exports = router;
