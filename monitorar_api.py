import requests
import time
from datetime import datetime

def monitorar_api(url, intervalo_segundos=60, max_tentativas=10):
    """
    Monitora uma API periodicamente até que ela esteja funcionando.
    
    Args:
        url (str): URL da API para monitorar
        intervalo_segundos (int): Intervalo entre tentativas em segundos
        max_tentativas (int): Número máximo de tentativas
    """
    print(f"Iniciando monitoramento da API: {url}")
    print(f"Verificando a cada {intervalo_segundos} segundos, máximo de {max_tentativas} tentativas")
    print("----------------------------------------")
    
    for tentativa in range(1, max_tentativas + 1):
        agora = datetime.now().strftime("%H:%M:%S")
        print(f"\nTentativa {tentativa}/{max_tentativas} às {agora}")
        
        try:
            print(f"Fazendo requisição para {url}...")
            inicio = time.time()
            response = requests.get(url, timeout=10)
            duracao = time.time() - inicio
            
            print(f"Status code: {response.status_code}")
            print(f"Tempo de resposta: {duracao:.2f} segundos")
            
            if response.status_code in [200, 201]:
                print(f"API está funcionando! Conteúdo da resposta:")
                try:
                    dados = response.json()
                    print(f"Resposta JSON: {dados}")
                    return True
                except:
                    print(f"Resposta não é JSON: {response.text[:500]}")
                    return True
            else:
                print(f"API não está funcionando corretamente. Status: {response.status_code}")
                print(f"Resposta: {response.text[:500]}")
        
        except requests.exceptions.ConnectionError:
            print("Erro de conexão: Não foi possível conectar ao servidor")
        except requests.exceptions.Timeout:
            print("Timeout: O servidor demorou muito para responder")
        except requests.exceptions.RequestException as e:
            print(f"Erro na requisição: {str(e)}")
        except Exception as e:
            print(f"Erro inesperado: {str(e)}")
        
        if tentativa < max_tentativas:
            print(f"Aguardando {intervalo_segundos} segundos para a próxima tentativa...")
            time.sleep(intervalo_segundos)
    
    print("\n----------------------------------------")
    print(f"Monitoramento concluído após {max_tentativas} tentativas.")
    print("A API não respondeu corretamente em nenhuma das tentativas.")
    return False

if __name__ == "__main__":
    url_api = "https://viccoin.onrender.com/api/health/"
    intervalo = 30  # 30 segundos entre tentativas
    max_tentativas = 5  # Máximo de 5 tentativas
    
    monitorar_api(url_api, intervalo, max_tentativas) 