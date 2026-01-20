export default function WelcomeCard() {
  return (
    <div className="bg-[#222525] rounded-xl p-6 border border-white/5">
      <h2 className="text-xl font-bold mb-4">
        Seja bem-vindo(a) ao Maven!
      </h2>

      <div className="space-y-6 text-sm sm:text-base
 text-gray-300">
        {/* Nickname */}
        <div>
          <p className="text-red-400 font-semibold mb-1">
            Como devo preencher o Nickname?
          </p>
          <p>
            <strong>Jogadores Bedrock:</strong> adicione um asterisco (*) no
            início do seu nick.
          </p>
          <p>
            <strong>Jogadores Java:</strong> use seu nick normalmente, sem
            alterações.
          </p>

          <p className="mt-2 text-gray-400">
            <strong>Exemplo:</strong>
            <br />• Java: <code>seunick</code>
            <br />• Bedrock: <code>*seunick</code>
          </p>
        </div>

        {/* Entrega */}
        <div>
          <p className="text-red-400 font-semibold mb-1">
            O VIP é entregue de imediato?
          </p>
          <p>
            Após o envio do comprovante de pagamento, nossa equipe (STAFF)
            realizará a entrega dos benefícios no menor tempo possível.
          </p>
        </div>

        {/* Pagamento */}
        <div>
          <p className="text-red-400 font-semibold mb-1">
            Quais métodos de pagamento a loja aceita?
          </p>
          <p>
            Aceitamos Mercado Pago, Pix, PayPal e Cartão de Crédito.
          </p>
        </div>

        {/* Reembolso */}
        <div>
          <p className="text-red-400 font-semibold mb-1">
            Posso pedir reembolso?
          </p>
          <p>
            Ao realizar uma compra, você está fazendo uma doação para a
            manutenção do servidor. Por esse motivo, não realizamos reembolsos,
            independentemente do motivo.
          </p>
          <p className="mt-2">
            Caso algum benefício não funcione corretamente, você poderá
            solicitar a troca por outro item funcional ou por um benefício
            superior, caso não haja item equivalente disponível.
          </p>
          <p className="mt-2 text-gray-400">
            Todos os benefícios são itens virtuais e temporários.
          </p>
        </div>

        {/* Suporte */}
        <div className="pt-4 border-t border-white/10">
          <p className="text-gray-300">
            Qualquer dúvida, entre em contato com nosso time abrindo um
            <span className="text-red-400 font-semibold">
              {" "}ticket no Discord
            </span>.
          </p>
        </div>
      </div>
    </div>
  );
}
