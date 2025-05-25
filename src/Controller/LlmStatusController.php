<?php

namespace App\Controller;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Contracts\HttpClient\HttpClientInterface;

class LlmStatusController extends AbstractController
{
    #[Route('/api/llm/status', name: 'llm_status')]
    public function check(HttpClientInterface $http): JsonResponse
    {
        try {
            $response = $http->request('GET', 'http://host.docker.internal:11434/api/tags');
            $data = $response->toArray();

            return $this->json([
                'status' => 'online',
                'models' => $data,
            ]);
        } catch (\Exception $e) {
            return $this->json([
                'status' => 'offline',
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}
