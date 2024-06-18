/**
 * @author Kevin
 * @Date: 2024-6-18
 */

const router = require('koa-router')();

const user = require('./user');
const room = require('./room');
const game = require('./game');

router.use('/user', user.routes(), user.allowedMethods());
router.use('/room', room.routes(), room.allowedMethods());
router.use('/game', game.routes(), room.allowedMethods());

module.exports = router;
