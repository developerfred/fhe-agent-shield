using Xunit;
using FHEAgentShield.SemanticKernel;

namespace FHEAgentShield.SemanticKernel.Tests;

public class FHECredentialProviderTests
{
    [Fact]
    public void StoreAndRetrieveCredential()
    {
        var config = new FHEConfiguration { Threshold = 2 };
        var provider = new FHECredentialProvider(config);

        var id = provider.StoreAsync("api_key", "secret123").Result;
        var value = provider.RetrieveAsync(id, 2).Result;

        Assert.Equal("secret123", value);
    }

    [Fact]
    public void InsufficientPermitsThrows()
    {
        var config = new FHEConfiguration { Threshold = 2 };
        var provider = new FHECredentialProvider(config);

        var id = provider.StoreAsync("key", "value").Result;

        Assert.Throws<UnauthorizedAccessException>(() => 
            provider.RetrieveAsync(id, 1).Result);
    }

    [Fact]
    public void ListCredentials()
    {
        var config = new FHEConfiguration();
        var provider = new FHECredentialProvider(config);

        provider.StoreAsync("key1", "value1").Wait();
        provider.StoreAsync("key2", "value2").Wait();

        var list = provider.ListCredentials();
        Assert.Equal(2, list.Count());
    }

    [Fact]
    public void DeleteCredential()
    {
        var config = new FHEConfiguration();
        var provider = new FHECredentialProvider(config);

        var id = provider.StoreAsync("key", "value").Result;
        provider.Delete(id);

        var list = provider.ListCredentials();
        Assert.Empty(list);
    }
}

public class FHEMemoryTests
{
    [Fact]
    public void AppendAndGetContext()
    {
        var config = new FHEConfiguration();
        var memory = new FHEMemory(config);

        memory.AppendAsync("agent-1", "Hello").Wait();
        memory.AppendAsync("agent-1", "World").Wait();

        var context = memory.GetContextAsync("agent-1", 10).Result;
        Assert.Equal(2, context.Count());
    }

    [Fact]
    public void GetContextWithLimit()
    {
        var config = new FHEConfiguration();
        var memory = new FHEMemory(config);

        for (int i = 0; i < 5; i++)
        {
            memory.AppendAsync("agent-1", $"Message {i}").Wait();
        }

        var context = memory.GetContextAsync("agent-1", 3).Result;
        Assert.Equal(3, context.Count());
    }
}
