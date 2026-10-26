import { criarApp } from './app.ts';

const porta = Number(process.env.PORTA ?? 3000);
criarApp().listen(porta, () => console.log(`API em http://localhost:${porta}`));
